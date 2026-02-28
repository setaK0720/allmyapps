"""戦略インスタンスの管理・並列実行を担う。"""

import logging
from typing import Optional

from mt5_client import MT5Client, OrderResult
from risk import RiskConfig, RiskManager
from strategies import STRATEGY_REGISTRY
from strategies.base import BaseStrategy, StrategyPosition

logger = logging.getLogger(__name__)

DEFAULT_LOT = 0.01


class StrategyRunner:
    def __init__(self, mt5: MT5Client, risk: RiskManager) -> None:
        self._mt5 = mt5
        self._risk = risk
        self._strategies: dict[int, BaseStrategy] = {}
        self._event_callbacks: list = []

    def add_event_callback(self, callback) -> None:  # type: ignore[type-arg]
        self._event_callbacks.append(callback)

    def _emit(self, event: dict) -> None:
        for cb in self._event_callbacks:
            try:
                cb(event)
            except Exception as e:
                logger.error("イベントコールバックエラー: %s", e)

    def load_from_configs(self, configs: list[dict]) -> None:
        """DB から取得した戦略設定を読み込む。"""
        for cfg in configs:
            if not cfg.get("enabled", False):
                continue
            self._register(cfg)

    def _register(self, cfg: dict) -> None:
        strategy_id = cfg["id"]
        strategy_type = cfg["strategy_type"]
        cls = STRATEGY_REGISTRY.get(strategy_type)
        if cls is None:
            logger.error("未知の戦略タイプ: %s", strategy_type)
            return
        strategy = cls(
            strategy_id=strategy_id,
            symbol=cfg["symbol"],
            timeframe=cfg["timeframe"],
            params=cfg.get("params", {}),
        )
        strategy.state.running = True
        self._strategies[strategy_id] = strategy
        logger.info("戦略登録: id=%d, type=%s, symbol=%s", strategy_id, strategy_type, cfg["symbol"])

    def start(self, strategy_id: int, cfg: dict) -> bool:
        if strategy_id in self._strategies:
            self._strategies[strategy_id].state.running = True
            self._strategies[strategy_id].state.paused = False
            logger.info("戦略開始: id=%d", strategy_id)
            return True
        self._register(cfg)
        return strategy_id in self._strategies

    def stop(self, strategy_id: int) -> bool:
        if strategy_id not in self._strategies:
            return False
        self._strategies[strategy_id].state.running = False
        logger.info("戦略停止: id=%d", strategy_id)
        return True

    def pause_all(self) -> None:
        for s in self._strategies.values():
            s.state.paused = True
        logger.info("全戦略を一時停止")

    def resume_all(self) -> None:
        for s in self._strategies.values():
            s.state.paused = False
        logger.info("全戦略を再開")

    def reload_configs(self, configs: list[dict]) -> None:
        """sync-config 時に戦略設定を再読み込みする。"""
        new_ids = {cfg["id"] for cfg in configs if cfg.get("enabled")}
        # 無効化された戦略を停止
        for sid in list(self._strategies.keys()):
            if sid not in new_ids:
                del self._strategies[sid]
                logger.info("戦略削除: id=%d", sid)
        # 新規・更新された戦略を登録
        for cfg in configs:
            if not cfg.get("enabled"):
                continue
            sid = cfg["id"]
            if sid not in self._strategies:
                self._register(cfg)
            else:
                # パラメータ更新
                self._strategies[sid].params = cfg.get("params", {})

    def on_tick(self, symbol: str, tick: dict) -> None:
        """Tick を受信し、当該シンボルの戦略を評価する。"""
        positions = self._mt5.get_positions()
        strategy_positions = [
            StrategyPosition(
                ticket=p.ticket,
                symbol=p.symbol,
                order_type=p.order_type,
                lot=p.lot,
                open_price=p.open_price,
                current_price=p.current_price,
                unrealized_pl=p.unrealized_pl,
            )
            for p in positions
        ]

        for strategy in self._strategies.values():
            if strategy.symbol != symbol:
                continue
            if not strategy.state.running or strategy.state.paused:
                continue
            strategy.update_positions(strategy_positions)
            try:
                action = strategy.on_tick(tick)
            except Exception as e:
                logger.error("戦略 on_tick エラー (id=%d): %s", strategy.strategy_id, e)
                continue

            if action is None:
                continue

            lot = float(strategy.params.get("lot", DEFAULT_LOT))

            if action == "CLOSE":
                pos = strategy.get_open_position()
                if pos is not None:
                    result = self._mt5.close_position(pos.ticket)
                    self._handle_close_result(strategy, pos.ticket, result)
            elif action in ("BUY", "SELL"):
                ok, reason = self._risk.can_place_order(
                    symbol=symbol,
                    lot=lot,
                    positions=positions,
                    drawdown=strategy.state.current_drawdown,
                )
                if not ok:
                    logger.warning("発注ブロック (id=%d): %s", strategy.strategy_id, reason)
                    # ドローダウン超過なら戦略停止
                    if "ドローダウン" in reason:
                        strategy.state.running = False
                        self._emit({"type": "risk_alert", "level": "error", "message": f"戦略 id={strategy.strategy_id} ドローダウン超過で停止"})
                    continue
                result = self._mt5.send_order(
                    symbol=symbol,
                    order_type=action,
                    lot=lot,
                    magic=strategy.strategy_id,
                )
                self._handle_order_result(strategy, action, lot, tick, result)

    def _handle_order_result(self, strategy: BaseStrategy, action: str, lot: float, tick: dict, result: OrderResult) -> None:
        if result.success and result.ticket is not None:
            strategy.state.total_trades += 1
            price = tick.get("ask") if action == "BUY" else tick.get("bid")
            self._emit({
                "type": "order_opened",
                "ticket": result.ticket,
                "symbol": strategy.symbol,
                "order_type": action,
                "lot": lot,
                "price": price,
                "strategy_id": strategy.strategy_id,
            })
        else:
            logger.error("発注失敗 (id=%d): %s", strategy.strategy_id, result.error)

    def _handle_close_result(self, strategy: BaseStrategy, ticket: int, result: OrderResult) -> None:
        if result.success:
            self._emit({
                "type": "order_closed",
                "ticket": ticket,
                "strategy_id": strategy.strategy_id,
            })
        else:
            logger.error("決済失敗 (ticket=%d): %s", ticket, result.error)

    def get_status(self) -> list[dict]:
        return [s.to_dict() for s in self._strategies.values()]
