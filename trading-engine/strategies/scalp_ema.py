"""EMA クロスオーバー スキャルピング戦略。

params:
    fast_period (int): 短期 EMA 期間（デフォルト: 5）
    slow_period (int): 長期 EMA 期間（デフォルト: 20）
    tp_pips (float): 利確 pips（デフォルト: 10）
    sl_pips (float): 損切り pips（デフォルト: 5）
"""

from collections import deque
from typing import Optional

from .base import BaseStrategy


def _ema(values: list[float], period: int) -> float:
    """末尾 period 件から EMA を計算する。"""
    if len(values) < period:
        return sum(values) / len(values)
    k = 2.0 / (period + 1)
    ema = values[-period]
    for v in values[-period + 1 :]:
        ema = v * k + ema * (1 - k)
    return ema


class ScalpEmaStrategy(BaseStrategy):
    """EMA クロスオーバー戦略。

    fast EMA が slow EMA を上抜けしたら BUY、下抜けしたら SELL。
    """

    def __init__(self, strategy_id: int, symbol: str, timeframe: str, params: dict) -> None:
        super().__init__(strategy_id, symbol, timeframe, params)
        self._fast = int(params.get("fast_period", 5))
        self._slow = int(params.get("slow_period", 20))
        self._tp_pips = float(params.get("tp_pips", 10))
        self._sl_pips = float(params.get("sl_pips", 5))
        self._prices: deque[float] = deque(maxlen=self._slow * 3)
        self._prev_fast_above: Optional[bool] = None

    def on_tick(self, tick: dict) -> Optional[str]:
        mid = (tick["bid"] + tick["ask"]) / 2
        self._prices.append(mid)

        prices = list(self._prices)
        if len(prices) < self._slow:
            return None

        fast_ema = _ema(prices, self._fast)
        slow_ema = _ema(prices, self._slow)
        fast_above = fast_ema > slow_ema

        # ポジション保有中は決済シグナルをチェック
        pos = self.get_open_position()
        if pos is not None:
            pip_size = 0.01 if "JPY" in self.symbol else 0.0001
            pl_pips = (tick["bid"] - pos.open_price) / pip_size if pos.order_type == "BUY" else (pos.open_price - tick["ask"]) / pip_size
            if pl_pips >= self._tp_pips or pl_pips <= -self._sl_pips:
                self._prev_fast_above = fast_above
                return "CLOSE"
            # トレンド反転でも決済
            if (pos.order_type == "BUY" and not fast_above) or (pos.order_type == "SELL" and fast_above):
                self._prev_fast_above = fast_above
                return "CLOSE"
            return None

        # クロスオーバー判定（ポジションなし）
        if self._prev_fast_above is None:
            self._prev_fast_above = fast_above
            return None

        action: Optional[str] = None
        if not self._prev_fast_above and fast_above:
            action = "BUY"
        elif self._prev_fast_above and not fast_above:
            action = "SELL"

        self._prev_fast_above = fast_above
        return action
