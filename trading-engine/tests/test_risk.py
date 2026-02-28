"""risk.py のユニットテスト。"""

import pytest
from risk import RiskConfig, RiskManager


@pytest.fixture
def risk() -> RiskManager:
    rm = RiskManager()
    rm.update_config(RiskConfig(
        max_lot_per_trade=0.10,
        daily_loss_limit=100.0,
        max_open_positions=3,
        emergency_stop=False,
    ))
    return rm


def test_lot_within_limit(risk: RiskManager) -> None:
    assert risk.check_lot(0.01) is True
    assert risk.check_lot(0.10) is True


def test_lot_exceeds_limit(risk: RiskManager) -> None:
    assert risk.check_lot(0.11) is False
    assert risk.check_lot(1.0) is False


def test_max_positions_within_limit(risk: RiskManager) -> None:
    assert risk.check_max_positions(0) is True
    assert risk.check_max_positions(2) is True


def test_max_positions_at_limit(risk: RiskManager) -> None:
    assert risk.check_max_positions(3) is False
    assert risk.check_max_positions(10) is False


def test_no_duplicate_position(risk: RiskManager) -> None:
    positions = [{"symbol": "EURUSD"}]
    assert risk.check_duplicate_position("USDJPY", positions) is True


def test_duplicate_position_blocked(risk: RiskManager) -> None:
    positions = [{"symbol": "USDJPY"}]
    assert risk.check_duplicate_position("USDJPY", positions) is False


def test_drawdown_within_limit(risk: RiskManager) -> None:
    assert risk.check_strategy_drawdown(0.04) is True


def test_drawdown_exceeds_limit(risk: RiskManager) -> None:
    assert risk.check_strategy_drawdown(0.06) is False


def test_emergency_stop_blocks_order(risk: RiskManager) -> None:
    risk.update_config(RiskConfig(
        max_lot_per_trade=0.10,
        daily_loss_limit=100.0,
        max_open_positions=3,
        emergency_stop=True,
    ))
    assert risk.check_emergency_stop() is False


def test_can_place_order_all_ok(risk: RiskManager) -> None:
    ok, reason = risk.can_place_order("USDJPY", 0.01, [], 0.0)
    assert ok is True
    assert reason == ""


def test_can_place_order_lot_too_large(risk: RiskManager) -> None:
    ok, reason = risk.can_place_order("USDJPY", 1.0, [], 0.0)
    assert ok is False
    assert "ロット" in reason


def test_can_place_order_too_many_positions(risk: RiskManager) -> None:
    positions = [{"symbol": f"SYM{i}"} for i in range(3)]
    ok, reason = risk.can_place_order("USDJPY", 0.01, positions, 0.0)
    assert ok is False
    assert "ポジション" in reason
