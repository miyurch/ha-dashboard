"""Persist layout document in HA storage."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_KEY, STORAGE_VERSION

DEFAULT_LAYOUT: dict[str, Any] = {
    "version": 1,
    "theme": {"density": "comfortable", "accent": "#03a9f4"},
    "header": {"enabled": True, "heightPx": 56, "blocks": []},
    "body": {
        "columns": 12,
        "rowHeightPx": 72,
        "gapPx": 8,
        "blocks": [],
    },
    "footer": {"enabled": False, "heightPx": 48, "blocks": []},
}


class LayoutStore:
    """JSON layout backed by Store."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = dict(DEFAULT_LAYOUT)

    async def async_load(self) -> None:
        data = await self._store.async_load()
        if isinstance(data, dict):
            merged = dict(DEFAULT_LAYOUT)
            merged.update(data)
            if "header" in data and isinstance(data["header"], dict):
                merged["header"] = {**DEFAULT_LAYOUT["header"], **data["header"]}
            if "body" in data and isinstance(data["body"], dict):
                merged["body"] = {**DEFAULT_LAYOUT["body"], **data["body"]}
            if "footer" in data and isinstance(data["footer"], dict):
                merged["footer"] = {**DEFAULT_LAYOUT["footer"], **data["footer"]}
            if "theme" in data and isinstance(data["theme"], dict):
                merged["theme"] = {**DEFAULT_LAYOUT["theme"], **data["theme"]}
            self._data = merged

    @property
    def data(self) -> dict[str, Any]:
        return self._data

    async def async_save(self, payload: dict[str, Any]) -> None:
        self._data = payload
        await self._store.async_save(payload)
