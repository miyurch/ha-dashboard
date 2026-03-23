"""Dashboard Builder — гибкий визуальный компоновщик дашборда."""

from __future__ import annotations

import logging
import pathlib

import voluptuous as vol
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, STATIC_URL_PATH
from .http_api import LayoutView
from .storage_helper import LayoutStore

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = vol.Schema(
    {vol.Optional(DOMAIN): vol.Schema({})},
    extra=vol.ALLOW_EXTRA,
)


async def _async_ensure_loaded(hass: HomeAssistant) -> None:
    if DOMAIN in hass.data:
        return

    www = pathlib.Path(__file__).parent / "www"
    if not www.is_dir():
        _LOGGER.warning(
            "%s: папка www не найдена. Соберите фронтенд: "
            "cd frontend && npm install && npm run build",
            DOMAIN,
        )

    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL_PATH, str(www.resolve()), cache_headers=False)]
    )

    store = LayoutStore(hass)
    await store.async_load()

    hass.http.register_view(LayoutView(hass, store))

    hass.data[DOMAIN] = {"store": store}


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Поддержка записи в configuration.yaml: `dashboard_builder:`."""
    await _async_ensure_loaded(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Добавление через Настройки → Устройства и службы."""
    await _async_ensure_loaded(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:  # noqa: ARG001
    return True
