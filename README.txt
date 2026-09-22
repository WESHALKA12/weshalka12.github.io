THE | WESHALKA — сайт-каталог верхней одежды (theweshalka.ru).

Хостинг: GitHub Pages (репозиторий WESHALKA12/weshalka12.github.io, ветка main), домен theweshalka.ru, HTTPS.

Контент:
- data/catalog.json — все товары (порядок = порядок на сайте), цвета, фото, видео, цены, размеры, наличие;
- data/site.json — тексты главной, контакты (Telegram, MAX, VK, WhatsApp), акции, отзывы;
- assets/images/ — фото и видео (оригиналы не удаляются; упорядоченные копии — в assets/images/catalog/).

Админ-панель: /admin/ (Sveltia CMS, вход токеном GitHub). Инструкция: admin/instrukciya.md.
Сохранение в админке = коммит в main → GitHub Pages публикует за 1–2 минуты.
Проверка данных: tools/validate_data.py (запускается GitHub Actions при каждом изменении data/).

Локальный запуск: python3 -m http.server 4173 → http://127.0.0.1:4173/
