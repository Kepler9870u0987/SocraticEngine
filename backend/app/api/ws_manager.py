"""
WebSocket connection manager for real-time AI interventions.

Manages per-document connections and handles streaming with abort support.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Optional

from fastapi import WebSocket

log = logging.getLogger(__name__)


class ConnectionManager:
    """Tracks active WebSocket connections keyed by (document_id, user_id)."""

    def __init__(self) -> None:
        # (doc_id, user_id) → WebSocket
        self._connections: dict[tuple[str, str], WebSocket] = {}
        # (doc_id, user_id) → asyncio.Task (in-flight generation)
        self._active_tasks: dict[tuple[str, str], asyncio.Task] = {}

    async def connect(self, ws: WebSocket, doc_id: str, user_id: str) -> None:
        await ws.accept()
        key = (doc_id, user_id)
        # Cancel any leftover task from a previous connection
        await self._cancel_task(key)
        self._connections[key] = ws
        log.info("WS connected: doc=%s user=%s", doc_id, user_id)

    def disconnect(self, doc_id: str, user_id: str) -> None:
        key = (doc_id, user_id)
        self._connections.pop(key, None)
        log.info("WS disconnected: doc=%s user=%s", doc_id, user_id)

    async def abort(self, doc_id: str, user_id: str) -> None:
        await self._cancel_task((doc_id, user_id))

    def get_ws(self, doc_id: str, user_id: str) -> Optional[WebSocket]:
        return self._connections.get((doc_id, user_id))

    def register_task(self, doc_id: str, user_id: str, task: asyncio.Task) -> None:
        key = (doc_id, user_id)
        old = self._active_tasks.pop(key, None)
        if old and not old.done():
            old.cancel()
        self._active_tasks[key] = task

    async def _cancel_task(self, key: tuple[str, str]) -> None:
        task = self._active_tasks.pop(key, None)
        if task and not task.done():
            task.cancel()
            try:
                await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass


# Singleton shared by all WebSocket endpoint handlers
manager = ConnectionManager()
