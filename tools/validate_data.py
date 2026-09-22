"""Проверка данных сайта: запускается GitHub Actions после каждого сохранения в админке."""
import json, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []
def load(path):
    try:
        return json.load(open(os.path.join(root, path), encoding='utf-8'))
    except Exception as e:
        errors.append(f'{path}: не читается как JSON ({e})')
        return None
catalog = load('data/catalog.json')
site = load('data/site.json')
def exists(path, where):
    if path and not path.startswith('http') and not os.path.exists(os.path.join(root, path.lstrip('/'))):
        errors.append(f'{where}: файл не найден — {path}')
if catalog:
    ids = set()
    for i, p in enumerate(catalog.get('products', []), 1):
        where = f'Товар №{i} «{p.get("name", "?")}»'
        if not p.get('id'): errors.append(f'{where}: не заполнен адрес страницы')
        elif p['id'] in ids: errors.append(f'{where}: адрес «{p["id"]}» повторяется')
        ids.add(p.get('id'))
        if not p.get('colors'): errors.append(f'{where}: нет ни одного цвета')
        for c in p.get('colors', []):
            if not c.get('files'): errors.append(f'{where}, цвет «{c.get("label")}»: нет фотографий')
            for f in c.get('files', []): exists(f, f'{where}, цвет «{c.get("label")}»')
            exists(c.get('video'), f'{where}, цвет «{c.get("label")}» (видео)')
if site:
    for k, v in (site.get('home') or {}).items():
        if isinstance(v, str) and v.startswith('/assets/'): exists(v, f'Главная: {k}')
    exists((site.get('contacts') or {}).get('showroomVideo'), 'Контакты: видео')
if errors:
    print('Найдены ошибки в данных сайта:'); print('\n'.join(' - ' + e for e in errors)); sys.exit(1)
print(f'Данные в порядке: {len(catalog["products"])} товаров.')
