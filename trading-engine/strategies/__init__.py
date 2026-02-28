from .base import BaseStrategy, StrategyState
from .scalp_ema import ScalpEmaStrategy
from .scalp_rsi import ScalpRsiStrategy

STRATEGY_REGISTRY: dict[str, type[BaseStrategy]] = {
    "scalp_ema": ScalpEmaStrategy,
    "scalp_rsi": ScalpRsiStrategy,
}
