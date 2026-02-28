"""リスク管理モジュール（Layer 1: Python ハードリミット）。"""

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RiskConfig:
    max_lot_per_trade: float = 0.01
    daily_loss_limit: float = 100.0
    max_open_positions: int = 3
    emergency_stop: bool = False


class RiskManager:
    def __init__(self) -> None:
        self._config = RiskConfig()
        self._strategy_drawdown_limit: float = 0.05  # 5% ドローダウンで戦略停止

    def update_config(self, config: RiskConfig) -> None:
        self._config = config
        logger.info(
            "リスク設定更新: max_lot=%.2f, daily_loss=%.2f, max_positions=%d",
            config.max_lot_per_trade,
            config.daily_loss_limit,
            config.max_open_positions,
        )

    def check_lot(self, lot: float) -> bool:
        """ロットサイズがハードリミット以内かチェックする。"""
        if lot > self._config.max_lot_per_trade:
            logger.warning("ロット上限超過: %.2f > %.2f", lot, self._config.max_lot_per_trade)
            return False
        return True

    def check_max_positions(self, current_count: int) -> bool:
        """最大ポジション数以内かチェックする。"""
        if current_count >= self._config.max_open_positions:
            logger.warning("最大ポジション数に達しています: %d", current_count)
            return False
        return True

    def check_duplicate_position(self, symbol: str, positions: list) -> bool:
        """同一シンボルで重複ポジションがないかチェックする。"""
        for pos in positions:
            pos_symbol = pos.symbol if hasattr(pos, "symbol") else pos.get("symbol", "")
            if pos_symbol == symbol:
                logger.warning("重複ポジションあり: %s", symbol)
                return False
        return True

    def check_strategy_drawdown(self, drawdown: float) -> bool:
        """戦略単体のドローダウンが上限以内かチェックする。"""
        if drawdown > self._strategy_drawdown_limit:
            logger.warning("戦略ドローダウン上限超過: %.2f%%", drawdown * 100)
            return False
        return True

    def check_emergency_stop(self) -> bool:
        """緊急停止フラグを確認する。True の場合は発注禁止。"""
        if self._config.emergency_stop:
            logger.error("緊急停止フラグが有効です。発注をブロックします。")
            return False
        return True

    def can_place_order(self, symbol: str, lot: float, positions: list, drawdown: float) -> tuple[bool, str]:
        """発注可否を総合チェックする。

        Returns:
            (ok, reason): ok=True なら発注可能。False の場合は reason に理由。
        """
        if not self.check_emergency_stop():
            return False, "緊急停止中"
        if not self.check_lot(lot):
            return False, f"ロット上限超過: {lot} > {self._config.max_lot_per_trade}"
        if not self.check_max_positions(len(positions)):
            return False, f"最大ポジション数超過: {len(positions)}"
        if not self.check_duplicate_position(symbol, positions):
            return False, f"重複ポジション: {symbol}"
        if not self.check_strategy_drawdown(drawdown):
            return False, f"ドローダウン超過: {drawdown * 100:.1f}%"
        return True, ""
