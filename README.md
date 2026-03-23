# Dashboard Builder для Home Assistant

Гибкий **визуальный компоновщик** макета дашборда: отдельные зоны **шапка**, **тело (сетка)** и **подвал**, блоки с настраиваемой сеткой, сохранение в Home Assistant и экспорт/импорт JSON. Идея близка к [ha-fusion](https://github.com/matt8707/ha-fusion), но реализована как кастомная интеграция + статический UI.

Требуется **Home Assistant 2024.6+** (используется `async_register_static_paths`).

## Установка через HACS

1. В HACS → Интеграции → меню «⋮» → **Пользовательские репозитории** → добавьте URL этого Git-репозитория (тип: интеграция).
2. Установите **Dashboard Builder**.
3. Скопируйте папку `custom_components/dashboard_builder` в `config/custom_components/` (если HACS не сделал это сам).
4. Перезапустите Home Assistant.
5. **Настройки → Устройства и службы → Добавить интеграцию** → **Dashboard Builder** (достаточно одного экземпляра).

Либо в `configuration.yaml`:

```yaml
dashboard_builder:
```

## Сборка веб-интерфейса

После клонирования репозитория:

```bash
cd frontend
npm install
npm run build
```

Артефакты попадут в `custom_components/dashboard_builder/www/`. Без этой папки интеграция выдаст предупреждение в логах.

## Открытие компоновщика

В браузере (под той же сессией Home Assistant):

`https://<ваш-ha>:8123/dashboard_builder_web/`

Кнопки **Сохранить в HA** / **Загрузить** обращаются к `GET`/`POST` `/api/dashboard_builder/layout`. Если открываете UI с другого хоста, в **Подключение…** укажите базовый URL Home Assistant и [долгоживущий токен](https://www.home-assistant.io/docs/authentication/).

### Живой режим (состояния сущностей)

1. Переключитесь в **Просмотр** (не «Правка»).
2. Включите **Живой** на панели инструментов.
3. Для блоков типа **Сущность HA** подставляются актуальные `state` и `unit_of_measurement` из Home Assistant.

Под капотом: начальный снимок `GET /api/states`, затем подписка на WebSocket [`/api/websocket`](https://developers.home-assistant.io/docs/api/websocket) с событием `state_changed` (фильтрация по `entity_id` из макета на клиенте). Если долгоживущий токен не задан, используется периодический опрос REST каждые 15 с (без WebSocket).

Для `npm run dev` в Vite проксируются и HTTP `/api`, и `WS /api/websocket`.

## Пункт в боковом меню (опционально)

В `configuration.yaml`:

```yaml
panel_iframe:
  dashboard_builder:
    title: Dashboard Builder
    icon: mdi:view-dashboard
    url: /dashboard_builder_web/
```

## Add-on (Supervisor / OS)

Папка `addon/` рассчитана на репозиторий, где **контекст сборки** — корень проекта (есть `custom_components/dashboard_builder/www` после `npm run build`). Добавьте репозиторий в магазин дополнений или установите вручную. Через Ingress UI откроется тот же статический интерфейс; для API укажите внешний URL Home Assistant и токен в настройках UI.

## Разработка фронтенда

```bash
cd frontend
npm run dev
```

Прокси в `vite.config.ts` перенаправляет `/api` на `http://localhost:8123` — удобно при локальном HA.

## Лицензия

MIT (как исходный каркас проекта; при публикации укажите своего правообладателя в `manifest.json`).
