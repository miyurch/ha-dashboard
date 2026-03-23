"""HTTP API для сохранения макета."""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .const import API_PREFIX

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .storage_helper import LayoutStore

_LOGGER = logging.getLogger(__name__)


class LayoutView(HomeAssistantView):
    """GET/POST /api/dashboard_builder/layout."""

    url = f"{API_PREFIX}/layout"
    name = "api:dashboard_builder:layout"
    requires_auth = True

    def __init__(self, hass: HomeAssistant, store: LayoutStore) -> None:
        self.hass = hass
        self._store = store

    async def get(self, request: web.Request) -> web.Response:
        return web.json_response(self._store.data)

    async def post(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "invalid_json"}, status=400)
        if not isinstance(body, dict):
            return web.json_response({"error": "object_required"}, status=400)
        await self._store.async_save(body)
        _LOGGER.debug("Layout saved")
        return web.json_response({"ok": True})
