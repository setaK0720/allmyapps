"""MT5 接続ラッパー。MetaTrader5 ライブラリは Windows 専用のため、
非 Windows 環境ではモックモードで動作する。"""

import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import MetaTrader5 as mt5  # type: ignore[import-untyped]
    MT5_AVAILABLE = True
except ImportError:
    mt5 = None  # type: ignore[assignment]
    MT5_AVAILABLE = False
    logger.warning("MetaTrader5 ライブラリが見つかりません。モックモードで動作します。")


@dataclass
class Tick:
    symbol: str
    bid: float
    ask: float
    time: int
    volume: float


@dataclass
class AccountInfo:
    login: int
    balance: float
    equity: float
    margin: float
    free_margin: float
    currency: str


@dataclass
class OrderResult:
    success: bool
    ticket: Optional[int] = None
    error: Optional[str] = None


@dataclass
class Position:
    ticket: int
    symbol: str
    order_type: str  # "BUY" | "SELL"
    lot: float
    open_price: float
    current_price: float
    unrealized_pl: float
    open_time: int
    strategy_id: Optional[int] = None


# MT5 定数（ライブラリ未インストール時のフォールバック）
ORDER_TYPE_BUY = 0
ORDER_TYPE_SELL = 1
TRADE_ACTION_DEAL = 1
TRADE_ACTION_CLOSE_BY = 10
ORDER_FILLING_IOC = 1


class MT5Client:
    def __init__(self, mock: bool = False) -> None:
        self._connected = False
        self._mock = mock or not MT5_AVAILABLE
        self._mock_positions: list[Position] = []
        self._mock_ticket_counter = 100000

    def connect(self) -> bool:
        if self._mock:
            logger.info("MT5 モックモード: 接続成功（擬似）")
            self._connected = True
            return True
        try:
            if not mt5.initialize():
                logger.error("MT5 initialize() 失敗: %s", mt5.last_error())
                return False
            info = mt5.account_info()
            if info is None:
                logger.error("MT5 口座情報の取得に失敗しました")
                return False
            logger.info("MT5 接続成功: ログイン=%s, 残高=%.2f %s", info.login, info.balance, info.currency)
            self._connected = True
            return True
        except Exception as e:
            logger.exception("MT5 接続中にエラー: %s", e)
            return False

    def disconnect(self) -> None:
        if not self._mock and MT5_AVAILABLE:
            mt5.shutdown()
        self._connected = False
        logger.info("MT5 切断")

    def get_tick(self, symbol: str) -> Optional[Tick]:
        if self._mock:
            import random
            base = {"USDJPY": 149.50, "EURUSD": 1.0850, "GBPJPY": 188.20}.get(symbol, 100.0)
            spread = 0.02
            bid = base + random.uniform(-0.05, 0.05)
            return Tick(symbol=symbol, bid=bid, ask=bid + spread, time=0, volume=1.0)
        try:
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                return None
            return Tick(symbol=symbol, bid=tick.bid, ask=tick.ask, time=tick.time, volume=tick.volume)
        except Exception as e:
            logger.error("Tick 取得エラー (%s): %s", symbol, e)
            return None

    def get_positions(self) -> list[Position]:
        if self._mock:
            return list(self._mock_positions)
        try:
            raw = mt5.positions_get()
            if raw is None:
                return []
            return [
                Position(
                    ticket=p.ticket,
                    symbol=p.symbol,
                    order_type="BUY" if p.type == ORDER_TYPE_BUY else "SELL",
                    lot=p.volume,
                    open_price=p.price_open,
                    current_price=p.price_current,
                    unrealized_pl=p.profit,
                    open_time=p.time,
                    strategy_id=p.magic if p.magic != 0 else None,
                )
                for p in raw
            ]
        except Exception as e:
            logger.error("ポジション取得エラー: %s", e)
            return []

    def send_order(
        self,
        symbol: str,
        order_type: str,
        lot: float,
        sl: float = 0.0,
        tp: float = 0.0,
        magic: int = 0,
    ) -> OrderResult:
        if self._mock:
            self._mock_ticket_counter += 1
            tick = self.get_tick(symbol)
            price = tick.ask if order_type == "BUY" else tick.bid if tick else 0.0
            pos = Position(
                ticket=self._mock_ticket_counter,
                symbol=symbol,
                order_type=order_type,
                lot=lot,
                open_price=price,
                current_price=price,
                unrealized_pl=0.0,
                open_time=0,
                strategy_id=magic if magic != 0 else None,
            )
            self._mock_positions.append(pos)
            logger.info("モック注文: %s %s %.2f lot (ticket=%d)", order_type, symbol, lot, self._mock_ticket_counter)
            return OrderResult(success=True, ticket=self._mock_ticket_counter)
        try:
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                return OrderResult(success=False, error=f"Tick 取得失敗: {symbol}")
            price = tick.ask if order_type == "BUY" else tick.bid
            mt5_order_type = ORDER_TYPE_BUY if order_type == "BUY" else ORDER_TYPE_SELL
            request = {
                "action": TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": lot,
                "type": mt5_order_type,
                "price": price,
                "sl": sl,
                "tp": tp,
                "magic": magic,
                "comment": f"strategy_{magic}",
                "type_filling": ORDER_FILLING_IOC,
            }
            result = mt5.order_send(request)
            if result is None or result.retcode != 10009:
                error = mt5.last_error() if result is None else f"retcode={result.retcode}"
                return OrderResult(success=False, error=str(error))
            return OrderResult(success=True, ticket=result.order)
        except Exception as e:
            logger.exception("発注エラー: %s", e)
            return OrderResult(success=False, error=str(e))

    def close_position(self, ticket: int) -> OrderResult:
        if self._mock:
            self._mock_positions = [p for p in self._mock_positions if p.ticket != ticket]
            logger.info("モック決済: ticket=%d", ticket)
            return OrderResult(success=True, ticket=ticket)
        try:
            positions = mt5.positions_get(ticket=ticket)
            if not positions:
                return OrderResult(success=False, error=f"ポジションが見つかりません: ticket={ticket}")
            pos = positions[0]
            close_type = ORDER_TYPE_SELL if pos.type == ORDER_TYPE_BUY else ORDER_TYPE_BUY
            tick = mt5.symbol_info_tick(pos.symbol)
            if tick is None:
                return OrderResult(success=False, error="Tick 取得失敗")
            price = tick.bid if close_type == ORDER_TYPE_SELL else tick.ask
            request = {
                "action": TRADE_ACTION_DEAL,
                "symbol": pos.symbol,
                "volume": pos.volume,
                "type": close_type,
                "position": ticket,
                "price": price,
                "comment": "close",
                "type_filling": ORDER_FILLING_IOC,
            }
            result = mt5.order_send(request)
            if result is None or result.retcode != 10009:
                error = mt5.last_error() if result is None else f"retcode={result.retcode}"
                return OrderResult(success=False, error=str(error))
            return OrderResult(success=True, ticket=ticket)
        except Exception as e:
            logger.exception("決済エラー (ticket=%d): %s", ticket, e)
            return OrderResult(success=False, error=str(e))

    def close_all_positions(self) -> list[OrderResult]:
        positions = self.get_positions()
        results = []
        for pos in positions:
            result = self.close_position(pos.ticket)
            results.append(result)
            if not result.success:
                logger.error("全決済失敗 (ticket=%d): %s", pos.ticket, result.error)
        return results

    def get_account_info(self) -> Optional[AccountInfo]:
        if self._mock:
            return AccountInfo(login=12345, balance=10000.0, equity=10000.0, margin=0.0, free_margin=10000.0, currency="USD")
        try:
            info = mt5.account_info()
            if info is None:
                return None
            return AccountInfo(
                login=info.login,
                balance=info.balance,
                equity=info.equity,
                margin=info.margin,
                free_margin=info.margin_free,
                currency=info.currency,
            )
        except Exception as e:
            logger.error("口座情報取得エラー: %s", e)
            return None
