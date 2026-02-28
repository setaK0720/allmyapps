"""MT5 Trading Engine エントリーポイント。

使用方法:
    python engine.py [--mock]

    --mock: MT5 なしのモックモードで起動（テスト用）
"""

import argparse
import asyncio
import logging
import os
from concurrent.futures import ThreadPoolExecutor

import httpx
import uvicorn
from dotenv import load_dotenv

from bridge import app, broadcast_loop, enqueue_event, set_engine
from mt5_client import MT5Client
from risk import RiskConfig, RiskManager
from strategy_runner import StrategyRunner

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

MT5_SERVICE_URL = os.getenv("MT5_SERVICE_URL", "http://localhost:3001")
BRIDGE_PORT = int(os.getenv("BRIDGE_PORT", "8765"))
TICK_INTERVAL = float(os.getenv("TICK_INTERVAL", "0.05"))  # 50ms


class TradingEngine:
    def __init__(self, mock: bool = False) -> None:
        self.mt5 = MT5Client(mock=mock)
        self._risk = RiskManager()
        self.runner = StrategyRunner(self.mt5, self._risk)
        self.running = False
        self._executor = ThreadPoolExecutor(max_workers=4)
        self._active_symbols: set[str] = set()

        # イベントをブロードキャストキューに転送
        self.runner.add_event_callback(enqueue_event)

    async def initialize(self) -> bool:
        if not self.mt5.connect():
            logger.error("MT5 接続に失敗しました")
            return False
        await self.sync_config()
        return True

    async def sync_config(self) -> None:
        """mt5-service から最新の設定を取得して反映する。"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                strategies_res = await client.get(f"{MT5_SERVICE_URL}/api/strategies")
                risk_res = await client.get(f"{MT5_SERVICE_URL}/api/risk-config")

            if strategies_res.status_code == 200:
                raw = strategies_res.json()
                # Drizzle ORM はキャメルケースで返すのでスネークケースに変換
                configs = [
                    {
                        "id": c.get("id"),
                        "symbol": c.get("symbol"),
                        "timeframe": c.get("timeframe"),
                        "strategy_type": c.get("strategyType") or c.get("strategy_type"),
                        "params": c.get("params", {}),
                        "enabled": c.get("enabled", False),
                    }
                    for c in raw
                ]
                self.runner.reload_configs(configs)
                self._active_symbols = {c["symbol"] for c in configs if c.get("enabled")}
                logger.info("戦略設定を同期: %d 件", len(configs))

            if risk_res.status_code == 200:
                rc = risk_res.json()
                self._risk.update_config(RiskConfig(
                    max_lot_per_trade=float(rc.get("max_lot_per_trade", 0.01)),
                    daily_loss_limit=float(rc.get("daily_loss_limit", 100.0)),
                    max_open_positions=int(rc.get("max_open_positions", 3)),
                    emergency_stop=bool(rc.get("emergency_stop", False)),
                ))
        except Exception as e:
            logger.warning("設定同期に失敗（mt5-service が未起動かもしれません）: %s", e)

    async def _tick_loop(self) -> None:
        """Tick ポーリングループ（非同期）。"""
        loop = asyncio.get_event_loop()
        self.running = True
        logger.info("Tick ループ開始: symbols=%s, interval=%.0fms", self._active_symbols, TICK_INTERVAL * 1000)
        while self.running:
            for symbol in list(self._active_symbols):
                try:
                    tick = await loop.run_in_executor(self._executor, self.mt5.get_tick, symbol)
                    if tick is not None:
                        tick_dict = {"bid": tick.bid, "ask": tick.ask, "time": tick.time, "volume": tick.volume}
                        self.runner.on_tick(symbol, tick_dict)
                        # Tick イベントをブロードキャスト（負荷軽減のため一定割合で間引き可能）
                        enqueue_event({"type": "tick", "symbol": symbol, "bid": tick.bid, "ask": tick.ask})
                except Exception as e:
                    logger.error("Tick 処理エラー (%s): %s", symbol, e)

            # エンジン状態を定期送信（5秒ごと）
            account = await loop.run_in_executor(self._executor, self.mt5.get_account_info)
            if account:
                enqueue_event({
                    "type": "engine_status",
                    "running": True,
                    "equity": account.equity,
                    "balance": account.balance,
                    "strategies": self.runner.get_status(),
                })
            await asyncio.sleep(TICK_INTERVAL)

    async def run(self) -> None:
        if not await self.initialize():
            return
        set_engine(self)
        # WebSocket サーバーと Tick ループを並列実行
        config = uvicorn.Config(app, host="0.0.0.0", port=BRIDGE_PORT, log_level="warning")
        server = uvicorn.Server(config)
        await asyncio.gather(
            server.serve(),
            broadcast_loop(),
            self._tick_loop(),
        )

    def stop(self) -> None:
        self.running = False
        self.mt5.disconnect()


async def main() -> None:
    parser = argparse.ArgumentParser(description="MT5 Trading Engine")
    parser.add_argument("--mock", action="store_true", help="MT5 なしのモックモードで起動")
    args = parser.parse_args()

    engine = TradingEngine(mock=args.mock)
    logger.info("Trading Engine 起動中... (mock=%s, port=%d)", args.mock, BRIDGE_PORT)
    try:
        await engine.run()
    except KeyboardInterrupt:
        logger.info("Ctrl+C を受信。停止します...")
    finally:
        engine.stop()


if __name__ == "__main__":
    asyncio.run(main())
