"""WebSocket サーバー + REST エンドポイント。

mt5-service からの制御コマンドを受け付け、
エンジン内のイベントを接続クライアントにブロードキャストする。
"""

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Callable

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

if TYPE_CHECKING:
    from engine import TradingEngine

logger = logging.getLogger(__name__)

app = FastAPI(title="MT5 Trading Engine Bridge")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_engine: "TradingEngine | None" = None
_clients: set[WebSocket] = set()
_broadcast_queue: asyncio.Queue[dict] = asyncio.Queue()


def set_engine(engine: "TradingEngine") -> None:
    global _engine
    _engine = engine


async def broadcast_loop() -> None:
    """キューからイベントを取り出してクライアントにブロードキャストする。"""
    while True:
        event = await _broadcast_queue.get()
        if not _clients:
            continue
        message = json.dumps(event)
        disconnected: set[WebSocket] = set()
        for client in list(_clients):
            try:
                await client.send_text(message)
            except Exception:
                disconnected.add(client)
        _clients.difference_update(disconnected)


def enqueue_event(event: dict) -> None:
    """イベントをブロードキャストキューに追加する（同期コンテキストから呼べる）。"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.call_soon_threadsafe(_broadcast_queue.put_nowait, event)
    except Exception as e:
        logger.error("イベントエンキューエラー: %s", e)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    _clients.add(ws)
    logger.info("WebSocket クライアント接続: 合計 %d 件", len(_clients))
    try:
        while True:
            # クライアントからのメッセージを受け取る（切断検知のため）
            await ws.receive_text()
    except WebSocketDisconnect:
        _clients.discard(ws)
        logger.info("WebSocket クライアント切断: 残 %d 件", len(_clients))


# ---- REST エンドポイント ----

class StrategyControlRequest(BaseModel):
    strategy_id: int
    config: dict = {}


class ClosePositionRequest(BaseModel):
    ticket: int


@app.get("/status")
async def get_status() -> dict:
    if _engine is None:
        return {"running": False, "strategies": [], "equity": 0.0, "positions": []}
    account = _engine.mt5.get_account_info()
    raw_positions = _engine.mt5.get_positions()
    positions = [
        {
            "ticket": p.ticket,
            "symbol": p.symbol,
            "order_type": p.order_type,
            "lot": p.lot,
            "open_price": p.open_price,
            "current_price": p.current_price,
            "unrealized_pl": p.unrealized_pl,
            "open_time": str(p.open_time),
            "strategy_id": getattr(p, "strategy_id", None),
        }
        for p in raw_positions
    ]
    return {
        "running": _engine.running,
        "strategies": _engine.runner.get_status(),
        "equity": account.equity if account else 0.0,
        "balance": account.balance if account else 0.0,
        "currency": account.currency if account else "USD",
        "positions": positions,
    }


@app.post("/control/start")
async def control_start(req: StrategyControlRequest) -> dict:
    if _engine is None:
        return {"ok": False, "error": "Engine not initialized"}
    ok = _engine.runner.start(req.strategy_id, req.config)
    return {"ok": ok}


@app.post("/control/stop")
async def control_stop(req: StrategyControlRequest) -> dict:
    if _engine is None:
        return {"ok": False, "error": "Engine not initialized"}
    ok = _engine.runner.stop(req.strategy_id)
    return {"ok": ok}


@app.post("/control/pause")
async def control_pause() -> dict:
    if _engine is None:
        return {"ok": False}
    _engine.runner.pause_all()
    return {"ok": True}


@app.post("/control/resume")
async def control_resume() -> dict:
    if _engine is None:
        return {"ok": False}
    _engine.runner.resume_all()
    return {"ok": True}


@app.post("/control/close-all")
async def control_close_all() -> dict:
    if _engine is None:
        return {"ok": False, "error": "Engine not initialized"}
    results = _engine.mt5.close_all_positions()
    succeeded = sum(1 for r in results if r.success)
    enqueue_event({"type": "engine_status", "running": False, "message": "緊急停止: 全ポジション決済完了"})
    _engine.runner.pause_all()
    return {"ok": True, "closed": succeeded, "total": len(results)}


@app.post("/control/close-position")
async def control_close_position(req: ClosePositionRequest) -> dict:
    if _engine is None:
        return {"ok": False, "error": "Engine not initialized"}
    result = _engine.mt5.close_position(req.ticket)
    return {"ok": result.success, "error": result.error}


@app.post("/control/sync-config")
async def control_sync_config() -> dict:
    if _engine is None:
        return {"ok": False}
    await _engine.sync_config()
    return {"ok": True}
