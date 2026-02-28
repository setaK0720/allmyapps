"""mt5_client.py のユニットテスト（モックモード使用）。"""

import pytest
from mt5_client import MT5Client, OrderResult


@pytest.fixture
def client() -> MT5Client:
    c = MT5Client(mock=True)
    c.connect()
    return c


def test_connect_mock(client: MT5Client) -> None:
    assert client._connected is True


def test_get_tick_returns_tick(client: MT5Client) -> None:
    tick = client.get_tick("USDJPY")
    assert tick is not None
    assert tick.symbol == "USDJPY"
    assert tick.bid > 0
    assert tick.ask > tick.bid


def test_get_positions_empty_initially(client: MT5Client) -> None:
    positions = client.get_positions()
    assert positions == []


def test_send_order_buy(client: MT5Client) -> None:
    result = client.send_order("USDJPY", "BUY", 0.01)
    assert result.success is True
    assert result.ticket is not None
    assert result.error is None


def test_send_order_sell(client: MT5Client) -> None:
    result = client.send_order("EURUSD", "SELL", 0.01)
    assert result.success is True
    assert result.ticket is not None


def test_get_positions_after_order(client: MT5Client) -> None:
    client.send_order("USDJPY", "BUY", 0.01)
    positions = client.get_positions()
    assert len(positions) == 1
    assert positions[0].symbol == "USDJPY"
    assert positions[0].order_type == "BUY"


def test_close_position(client: MT5Client) -> None:
    order = client.send_order("USDJPY", "BUY", 0.01)
    assert order.ticket is not None
    result = client.close_position(order.ticket)
    assert result.success is True
    positions = client.get_positions()
    assert len(positions) == 0


def test_close_nonexistent_position(client: MT5Client) -> None:
    result = client.close_position(999999)
    assert result.success is True  # モックは常に成功


def test_close_all_positions(client: MT5Client) -> None:
    client.send_order("USDJPY", "BUY", 0.01)
    client.send_order("EURUSD", "SELL", 0.01)
    assert len(client.get_positions()) == 2
    results = client.close_all_positions()
    assert all(r.success for r in results)
    assert len(client.get_positions()) == 0


def test_get_account_info(client: MT5Client) -> None:
    info = client.get_account_info()
    assert info is not None
    assert info.balance > 0
    assert info.currency == "USD"
