"""戦略基底クラス。全戦略はこのクラスを継承する。"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class StrategyState:
    id: int
    symbol: str
    timeframe: str
    running: bool = False
    paused: bool = False
    peak_equity: float = 0.0
    current_drawdown: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0


@dataclass
class StrategyPosition:
    ticket: int
    symbol: str
    order_type: str  # "BUY" | "SELL"
    lot: float
    open_price: float
    current_price: float
    unrealized_pl: float


class BaseStrategy(ABC):
    """全戦略の基底クラス。

    サブクラスは on_tick を実装し、売買シグナルを返す。
    """

    def __init__(self, strategy_id: int, symbol: str, timeframe: str, params: dict) -> None:
        self.strategy_id = strategy_id
        self.symbol = symbol
        self.timeframe = timeframe
        self.params = params
        self.state = StrategyState(id=strategy_id, symbol=symbol, timeframe=timeframe)
        self._positions: list[StrategyPosition] = []

    @abstractmethod
    def on_tick(self, tick: dict) -> Optional[str]:
        """Tick を受け取り、アクションを返す。

        Returns:
            "BUY"   - 買い発注
            "SELL"  - 売り発注
            "CLOSE" - 決済
            None    - 何もしない
        """
        ...

    def on_trade_event(self, event: dict) -> None:
        """約定イベントを受け取る（任意実装）。"""
        pass

    def update_positions(self, positions: list[StrategyPosition]) -> None:
        """オープンポジション一覧を更新する。"""
        self._positions = [p for p in positions if p.symbol == self.symbol]

    def has_open_position(self) -> bool:
        return len(self._positions) > 0

    def get_open_position(self) -> Optional[StrategyPosition]:
        return self._positions[0] if self._positions else None

    def update_drawdown(self, current_equity: float) -> None:
        if current_equity > self.state.peak_equity:
            self.state.peak_equity = current_equity
        if self.state.peak_equity > 0:
            self.state.current_drawdown = (self.state.peak_equity - current_equity) / self.state.peak_equity

    def to_dict(self) -> dict:
        return {
            "id": self.state.id,
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "running": self.state.running,
            "paused": self.state.paused,
            "drawdown": round(self.state.current_drawdown * 100, 2),
            "total_trades": self.state.total_trades,
        }
