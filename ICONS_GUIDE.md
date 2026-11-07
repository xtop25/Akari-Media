# Генерация иконок для Akari Media

## Автоматическая генерация через Tauri CLI

### 1. Установите Tauri CLI (если ещё не установлен):
```bash
npm install -g @tauri-apps/cli
```

### 2. Сгенерируйте иконки из SVG:
```bash
tauri icon icon.svg
```

Это создаст все необходимые размеры иконок в `src-tauri/icons/`:
- 32x32.png
- 128x128.png  
- 128x128@2x.png
- icon.icns (macOS)
- icon.ico (Windows)

## Альтернатива: Использование готовой PNG иконки

Если у вас есть PNG иконка 1024x1024:

```bash
tauri icon path/to/your-icon.png
```

## Онлайн генераторы

Если Tauri CLI не работает, используйте онлайн сервисы:

1. **Favicon Generator**: https://realfavicongenerator.net/
2. **ICO Convert**: https://icoconvert.com/
3. **App Icon Generator**: https://www.appicon.co/

Загрузите `icon.svg` или создайте PNG 1024x1024 и загрузите на эти сервисы.

## Ручное создание иконок

Если нужно вручную:

1. Откройте `icon.svg` в Inkscape, Figma или Photoshop
2. Экспортируйте в PNG со следующими размерами:
   - 32x32px -> `32x32.png`
   - 128x128px -> `128x128.png`
   - 256x256px -> `128x128@2x.png`
   - 512x512px -> для генерации .ico
3. Используйте онлайн конвертер для создания `.ico` и `.icns`

## Обновление конфигурации

После генерации иконок, убедитесь что в `src-tauri/tauri.conf.json` указаны правильные пути:

```json
"bundle": {
  "icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
}
```

## Дизайн текущей иконки

Текущая иконка в `icon.svg`:
- Градиент от фиолетового (#a855f7) к голубому (#06b6d4)
- Play кнопка в центре (символ медиаплеера)
- Буква "A" внизу (Akari Media)
- Современный минималистичный стиль

## Кастомизация

Вы можете отредактировать `icon.svg`:
- Изменить цвета градиента
- Добавить анимацию (для веб-версии)
- Изменить форму play кнопки
- Добавить свой логотип

После изменений запустите `tauri icon icon.svg` заново.
