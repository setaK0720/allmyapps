"""RSI スキャルピング戦略。

params:
    period (int): RSI 期間（デフォルト: 14）
    oversold (float): 売られすぎ閾値（デフォルト: 30）
    overbought (float): 買われすぎ閾値（デフォルト: 70）
    tp_pips (float): 利確 pips（デフォルト: 8）
    sl_pips (float): 損切り pips（デフォルト: 5）
"""

from collections import deque
from typing import Optional

from .base import BaseStrategy


def _rsi(prices: list[float], period: int) -> float:
    """Wilder の RSI を計算する。"""
    if len(prices) < period + 1:
        return 50.0
    gains = []
    losses = []
    for i in range(1, period + 1):
        diff = prices[-period - 1 + i] - prices[-period - 2 + i]
        gains.append(max(diff, 0.0))
        losses.append(max(-diff, 0.0))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


class ScalpRsiStrategy(BaseStrategy):
    """RSI 逆張りスキャルピング戦略。

    RSI が oversold から回復したら BUY、overbought から反落したら SELL。
    """

    def __init__(self, strategy_id: int, symbol: str, timeframe: str, params: dict) -> None:
        super().__init__(strategy_id, symbol, timeframe, params)
        self._period = int(params.get("period", 14))
        self._oversold = float(params.get("oversold", 30))
        self._overbought = float(params.get("overbought", 70))
        self._tp_pips = float(params.get("tp_pips", 8))
        self._sl_pips = float(params.get("sl_pips", 5))
        self._prices: deque[float] = deque(maxlen=self._period * 4)
        self._prev_rsi: Optional[float] = None

    def on_tick(self, tick: dict) -> Optional[str]:
        mid = (tick["bid"] + tick["ask"]) / 2
        self._prices.append(mid)

        prices = list(self._prices)
        if len(prices) < self._period + 1:
            return None

        current_rsi = _rsi(prices, self._period)

        # ポジション保有中は決済チェック
        pos = self.get_open_position()
        if pos is not None:
            pip_size = 0.01 if "JPY" in self.symbol else 0.0001
            pl_pips = (tick["bid"] - pos.open_price) / pip_size if pos.order_type == "BUY" else (pos.open_price - tick["ask"]) / pip_size
            if pl_pips >= self._tp_pips or pl_pips <= -self._sl_pips:
                self._prev_rsi = current_rsi
                return "CLOSE"
            # RSI 中立域に戻ったら決済
            if pos.order_type == "BUY" and current_rsi >= 50:
                self._prev_rsi = current_rsi
                return "CLOSE"
            if pos.order_type == "SELL" and current_rsi <= 50:
                self._prev_rsi = current_rsi
                return "CLOSE"
            return None

        if self._prev_rsi is None:
            self._prev_rsi = current_rsi
            return None

        action: Optional[str] = None
        # oversold からの回復 → BUY
        if self._prev_rsi < self._oversold and current_rsi >= self._oversold:
            action = "BUY"
        # overbought からの反落 → SELL
        elif self._prev_rsi > self._overbought and current_rsi <= self._overbought:
            action = "SELL"

        self._prev_rsi = current_rsi
        return action
