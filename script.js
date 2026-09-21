const $ = (s, root = document) => root.querySelector(s);
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const asset = (file) => `/assets/images/${file}`;
const isVideo = (file = '') => /\.(mp4|webm|mov)$/i.test(file);
const colorValue = {black:'#222222', burgundy:'#6d2437', brown:'#55392c', chocolate:'#55392c', graphite:'#4c4b4b', grey:'#727474', nude:'#c6ad98', beige:'#cbbba9', cream:'#e6d8c9', milk:'#e6ddd2', white:'#f0ede6'};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let products = [];

let cart = [];
function loadCart() { try { cart = JSON.parse(localStorage.getItem('weshalka_cart') || '[]'); } catch { cart = []; } }
function saveCart() { try { localStorage.setItem('weshalka_cart', JSON.stringify(cart)); } catch {} updateCartBadge(); }
function addToCart(productId, colorId, size) {
  loadCart();
  const existing = cart.find((item) => item.productId === productId && item.colorId === colorId && item.size === size);
  if (existing) existing.qty += 1; else cart.push({productId, colorId, size, qty: 1});
  saveCart();
}
function removeFromCart(index) { loadCart(); cart.splice(index, 1); saveCart(); }
function updateCartBadge() {
  const badge = $('[data-cart-count]');
  if (!badge) return;
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = total || '';
  badge.style.display = total ? 'flex' : 'none';
}
function cartTotal() {
  return cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    const color = product?.colors?.find((c) => c.id === item.colorId) || product?.colors?.[0];
    const price = parseInt((color?.price || product?.price || '').replace(/\D/g, ''), 10) || 0;
    return sum + price * item.qty;
  }, 0);
}
function formatPrice(num) { return num.toLocaleString('ru-RU') + ' ₽'; }
function openCartDrawer() {
  loadCart();
  let existing = $('[data-cart-drawer]');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.setAttribute('data-cart-drawer', '');
  const items = cart.map((item, i) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return '';
    const color = product.colors?.find((c) => c.id === item.colorId) || product.colors?.[0];
    const price = parseInt((color?.price || product?.price || '').replace(/\D/g, ''), 10) || 0;
    const file = color?.files?.[0];
    return `<div class="cart-item"><div class="cart-item__img">${file ? `<img src="${asset(file)}" alt="${esc(product.name)}" width="80" height="107">` : ''}</div><div class="cart-item__info"><strong>${esc(color?.name || product.name)}</strong><span>${esc(color?.label || '')}, ${esc(item.size)}</span><span class="cart-item__price">${price ? formatPrice(price) : 'Цена не указана'}</span></div><button class="cart-item__remove" type="button" data-remove-cart="${i}" aria-label="Удалить">&times;</button></div>`;
  }).join('');
  const total = cartTotal();
  const telegramText = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const color = product?.colors?.find((c) => c.id === item.colorId) || product?.colors?.[0];
    return `${product?.name || '?'}, ${color?.label || '?'}, ${item.size}, ${item.qty} шт.`;
  }).join('\n');
  overlay.innerHTML = `<div class="cart-drawer"><div class="cart-drawer__head"><h3>Корзина</h3><button class="cart-drawer__close" type="button" data-close-cart aria-label="Закрыть">&times;</button></div><div class="cart-drawer__body">${cart.length ? items : '<p class="cart-empty">Корзина пуста</p>'}</div>${cart.length ? `<div class="cart-drawer__footer"><div class="cart-total"><span>Итого:</span><strong>${formatPrice(total)}</strong></div><a class="button button--dark cart-order-btn" href="https://t.me/sharp_fin?text=${encodeURIComponent('Здравствуйте! Хочу оформить заказ:\n' + telegramText + '\n\nИтого: ' + formatPrice(total))}" target="_blank" rel="noopener noreferrer">Оформить заказ в Telegram <span>↗</span></a><p class="cart-note">Оплата при получении или через Яндекс Сплит без переплаты.</p></div>` : ''}</div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  overlay.addEventListener('click', (event) => { if (event.target === overlay || event.target.closest('[data-close-cart]')) { overlay.classList.remove('is-open'); setTimeout(() => overlay.remove(), 300); } });
  overlay.querySelectorAll('[data-remove-cart]').forEach((btn) => btn.addEventListener('click', () => { removeFromCart(Number(btn.dataset.removeCart)); openCartDrawer(); }));
}
const GROUPS = [
  {id:'classic', label:'Классика'},
  {id:'fitted', label:'Приталенные модели'},
  {id:'robe', label:'Пальто-халаты'},
  {id:'stand', label:'Пальто со стойкой'},
  {id:'blazer', label:'Пальто-пиджаки'},
  {id:'tall', label:'Высокий рост 170+'},
  {id:'winter', label:'Зимние пальто'},
  {id:'fur', label:'Экошубы'}
];
const posters = {};
function collectPosters() {
  products.forEach((product) => (product.colors || []).forEach((color) => {
    const photo = (color.files || []).find((file) => !isVideo(file));
    [...(color.files || []), color.video].forEach((file) => { if (file && isVideo(file) && photo && !posters[file]) posters[file] = photo; });
  }));
}
function productGroups(product) { return product.groups || []; }

function header() {
  return `<a class="skip-link" href="#main">К содержанию</a><header class="site-header" data-header><a class="brand" href="/" aria-label="THE | WESHALKA — на главную">THE <span>|</span> WESHALKA</a><nav class="desktop-nav" aria-label="Основная навигация"><a href="/catalog.html">Каталог</a><a href="/catalog.html?group=classic">Пальто</a><a href="/catalog.html?group=fur">Экошубы</a><a href="/collection.html">Коллекции</a><a href="/about.html">О нас</a><a href="/contacts.html">Контакты</a></nav><div class="header-actions"><button class="cart-toggle" type="button" data-cart-toggle aria-label="Корзина"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="cart-badge" data-cart-count style="display:none"></span></button><a class="header-link" href="https://t.me/The_weshalka" target="_blank" rel="noopener noreferrer">Telegram <span>↗</span></a></div><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle><span></span><span></span><span></span><b>Меню</b></button></header><div class="mobile-menu" id="mobile-menu" data-mobile-menu aria-hidden="true"><nav aria-label="Мобильная навигация"><a href="/catalog.html">Каталог <small>01</small></a><a href="/catalog.html?group=classic">Пальто <small>02</small></a><a href="/catalog.html?group=fur">Экошубы <small>03</small></a><a href="/collection.html">Коллекции <small>04</small></a><a href="/about.html">О нас <small>05</small></a><a href="/contacts.html">Контакты <small>06</small></a></nav><a href="https://t.me/The_weshalka" target="_blank" rel="noopener noreferrer" class="menu-contact">Перейти в Telegram <span>↗</span></a></div>`;
}

function footer() {
  return `<footer class="site-footer"><div class="footer-main"><a class="brand" href="/">THE <span>|</span> WESHALKA</a><div class="footer-info"><p>Верхняя одежда<br>для выразительного образа.</p><p class="footer-address">📍 Санкт-Петербург, ул. Садовая, 26Б<br>🕒 Ежедневно 12:00–20:00</p></div><div class="footer-socials"><a href="https://t.me/The_weshalka" target="_blank" rel="noopener noreferrer" class="footer-link">Telegram ↗</a><a href="https://vk.ru/club161262776" target="_blank" rel="noopener noreferrer" class="footer-link">ВКонтакте ↗</a><a href="https://wa.me/79818510666" target="_blank" rel="noopener noreferrer" class="footer-link">WhatsApp ↗</a></div></div><div class="footer-bottom"><span>© ИП Гриднева Гулафруз. THE | WESHALKA. Все права защищены.</span><div><a href="/privacy.html">Политика конфиденциальности</a><a href="/personal-data.html">Персональные данные</a><a href="/documents.html">Документы</a></div></div></footer>`;
}

function media(file, alt, loading = 'lazy', className = '') {
  if (!file) return '';
  if (isVideo(file)) {
    const poster = posters[file];
    return `<video class="${className}" src="${asset(file)}"${poster ? ` poster="${asset(poster)}" data-fallback="${esc(poster)}"` : ''} aria-label="${esc(alt)}" muted loop autoplay playsinline preload="metadata"></video>`;
  }
  const priority = loading === 'eager' ? ' fetchpriority="high"' : '';
  return `<img class="${className}" src="${asset(file)}" alt="${esc(alt)}" loading="${loading}" decoding="async"${priority} width="1280" height="1707">`;
}

function firstColor(product) { return product.colors?.[0] || {}; }
function firstFile(product) { return firstColor(product).files?.[0]; }
function productLabel(product) { return `${product.name} — ${product.title}`; }
function modelWord(count) { const n = count % 100, d = count % 10; if (n > 10 && n < 20) return 'моделей'; return d === 1 ? 'модель' : d > 1 && d < 5 ? 'модели' : 'моделей'; }
function heroFrames() {
  const frames = [];
  const seen = new Set();
  products.forEach((product) => {
    if (frames.length >= 12) return;
    const color = (product.colors || [])[0];
    if (!color) return;
    const file = color.files?.[0] || color.video;
    if (!file || seen.has(file)) return;
    seen.add(file);
    frames.push({file, title: color.name || product.name, collection: product.collection || 'THE | WESHALKA', label: color.label || '', alt: `${color.name || product.name}, ${color.label || ''}`, productId: product.id, video: isVideo(file)});
  });
  return frames;
}
function bindHeroShowcase() {
  const root = $('[data-hero-showcase]');
  if (!root) return;
  const frame = $('[data-hero-frame]', root);
  const mediaRoot = $('[data-hero-media]', root);
  const title = $('[data-hero-title]', root);
  const collection = $('[data-hero-collection]', root);
  const label = $('[data-hero-label]', root);
  const counter = $('[data-hero-counter]', root);
  const dots = $('[data-hero-dots]', root);
  const frames = heroFrames();
  if (!frame || !mediaRoot || frames.length < 2) return;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Подборка моделей THE | WESHALKA. Нажмите справа или слева для переключения.');
  root.setAttribute('tabindex', '0');
  let index = 0;
  let timer;
  let pointerStartX = null;
  const render = (next, instant = false) => {
    index = (next + frames.length) % frames.length;
    const item = frames[index];
    const swap = () => {
      mediaRoot.innerHTML = media(item.file, item.alt, 'eager', 'hero-showcase__media');
      title.textContent = item.title;
      collection.textContent = `${item.collection}${item.video ? ' / VIDEO' : ''}`;
      label.textContent = item.label;
      if (counter) counter.textContent = '';
      dots?.querySelectorAll('button').forEach((button, dotIndex) => button.classList.toggle('is-active', dotIndex === index));
    };
    if (instant || reducedMotion) {
      swap();
      return;
    }
    frame.classList.add('is-changing');
    window.setTimeout(() => { swap(); frame.classList.remove('is-changing'); }, 320);
  };
  dots.innerHTML = frames.map((item, dotIndex) => `<button type="button" class="${dotIndex === 0 ? 'is-active' : ''}" data-hero-dot="${dotIndex}" aria-label="Показать ${esc(item.title)}"></button>`).join('');
  const reset = () => { window.clearInterval(timer); if (!reducedMotion) timer = window.setInterval(() => render(index + 1), 1900); };
  const advance = (direction = 1) => { render(index + direction); reset(); };
  dots.querySelectorAll('button').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); render(Number(button.dataset.heroDot)); reset(); }));
  root.addEventListener('pointerdown', (event) => { if (!event.target.closest('button, a')) pointerStartX = event.clientX; });
  root.addEventListener('pointerup', (event) => {
    if (pointerStartX === null || event.target.closest('button, a')) { pointerStartX = null; return; }
    const delta = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(delta) > 40) advance(delta < 0 ? 1 : -1);
    else advance(event.clientX >= root.getBoundingClientRect().left + root.getBoundingClientRect().width * .55 ? 1 : -1);
  });
  root.addEventListener('pointercancel', () => { pointerStartX = null; });
  root.addEventListener('keydown', (event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); advance(event.key === 'ArrowRight' ? 1 : -1); } });
  render(0, true);
  reset();
}
function swatches(product, selected, compact = false) {
  if (!product.colors || product.colors.length < 2) return `<span class="color-caption">${esc(firstColor(product).label || '')}</span>`;
  return `<div class="swatches ${compact ? 'swatches--compact' : ''}" role="group" aria-label="Цветовые варианты">${product.colors.map((color, i) => `<button class="swatch ${color.id === selected ? 'is-active' : ''}" type="button" data-color="${esc(color.id)}" data-product-id="${esc(product.id)}" style="--swatch:${colorValue[color.id] || '#bbb'}" aria-label="${esc(color.label)}" aria-pressed="${color.id === selected}"></button>`).join('')}<span class="color-caption">${esc(product.colors.find((c) => c.id === selected)?.label || '')}</span></div>`;
}

function productCard(product, index = 0) {
  const color = firstColor(product);
  const file = color.files?.[0];
  const alt = `${product.name}, ${color.label || ''}`;
  const currentPrice = color.price || product.price || 'Цена не указана';
  const oldPriceDisplay = product.oldPrice ? `<s class="old-price">${esc(product.oldPrice)}</s> ` : '';
  return `<article class="catalog-card" data-card data-id="${esc(product.id)}" data-category="${esc(product.category)}" data-silhouette="${esc(product.silhouette)}" data-collection="${esc(product.collection)}" data-tall="${product.tall ? 'yes' : 'no'}" data-group="${esc(productGroups(product).join(' '))}" data-season="${product.winter ? 'winter' : 'demi'}" data-price="${parseInt((color.price || product.price || '').replace(/\D/g,''),10) || ''}"><a class="catalog-card__visual" href="/product.html?id=${encodeURIComponent(product.id)}" aria-label="Открыть ${esc(product.name)}">${product.badge ? `<span class="badge">${esc(product.badge)}</span>` : ''}${media(file, alt, index < 2, '')}</a><div class="catalog-card__info"><div><small>${esc(product.collection)}${product.tall ? ' / 170+' : ''}</small><h2>${esc(product.name)}</h2><p>${esc(product.title)}</p>${swatches(product, color.id, true)}</div><div class="card-price"><strong>${oldPriceDisplay}${esc(currentPrice)}</strong><a class="underlink" href="/product.html?id=${encodeURIComponent(product.id)}">Открыть <span>↗</span></a></div></div></article>`;
}

function shell(content, title = '') {
  const app = $('#app');
  app.innerHTML = `${header()}<main id="main">${content}</main>${footer()}`;
  if (title) document.title = `${title} — THE | WESHALKA`;
  bindCommon();
  bindHeroShowcase();
  bindProductGallery();
}

function bindVideoFallback() {
  document.addEventListener('error', (event) => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement) || !video.dataset.fallback) return;
    const img = document.createElement('img');
    img.className = video.className;
    img.src = asset(video.dataset.fallback);
    img.alt = video.getAttribute('aria-label') || '';
    img.decoding = 'async';
    video.replaceWith(img);
  }, true);
}

function groupLinks(dark = false) {
  return `<nav class="group-links ${dark ? 'group-links--dark' : ''}" aria-label="Категории каталога">${GROUPS.map((group, i) => {
    const count = products.filter((product) => productGroups(product).includes(group.id)).length;
    return `<a href="/catalog.html?group=${group.id}"><small>${String(i + 1).padStart(2, '0')}</small><span>${esc(group.label)}</span><i>${count} ${modelWord(count)}</i></a>`;
  }).join('')}</nav>`;
}

function bindCommon() {
  const headerEl = $('[data-header]');
  const syncHeader = () => headerEl?.classList.toggle('is-scrolled', window.scrollY > 30);
  window.addEventListener('scroll', syncHeader, {passive:true}); syncHeader();
  const toggle = $('[data-menu-toggle]'); const menu = $('[data-mobile-menu]');
  const setMenu = (open) => { toggle?.setAttribute('aria-expanded', String(open)); menu?.setAttribute('aria-hidden', String(!open)); menu?.classList.toggle('is-open', open); document.body.classList.toggle('is-locked', open); };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), {threshold:.1}) : null;
  document.querySelectorAll('.reveal').forEach((item) => observer ? observer.observe(item) : item.classList.add('is-visible'));
  document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => { if ($('[data-product-detail]')) setProductColor(button.dataset.color); else if (button.closest('[data-card]')) { const card = button.closest('[data-card]'); const product = products.find((item) => item.id === card.dataset.id); const color = product?.colors.find((item) => item.id === button.dataset.color); if (color) card.querySelector('img')?.setAttribute('src', asset(color.files[0])); card.querySelectorAll('[data-color]').forEach((item) => item.classList.toggle('is-active', item === button)); }}));
  const cartToggle = $('[data-cart-toggle]');
  if (cartToggle) cartToggle.addEventListener('click', openCartDrawer);
  const addToCartBtn = $('[data-add-to-cart]');
  if (addToCartBtn) addToCartBtn.addEventListener('click', () => {
    const sizeSelect = $('[data-size]');
    const size = sizeSelect?.value;
    if (!size) { sizeSelect?.focus(); sizeSelect?.classList.add('shake'); setTimeout(() => sizeSelect?.classList.remove('shake'), 600); return; }
    addToCart(activeProduct.id, activeColor, size);
    addToCartBtn.textContent = '✓ Добавлено';
    addToCartBtn.disabled = true;
    setTimeout(() => { addToCartBtn.textContent = 'Добавить в корзину'; addToCartBtn.disabled = false; }, 1500);
  });
  loadCart();
  updateCartBadge();
}

function homePage() {
  const heroProduct = products.find((p) => p.id === 'high-icon') || products[0];
  const heroColor = heroProduct.colors[0];
  const selected = products.filter((p) => ['cream-icon','high-icon','fitted-wool','fitted-premium'].includes(p.id));
  const tallProducts = products.filter((p) => p.tall === true);
  const regularProducts = products.filter((p) => !p.tall && !productGroups(p).includes('fur'));
  const standProducts = products.filter((p) => productGroups(p).includes('stand'));
  const furProducts = products.filter((p) => productGroups(p).includes('fur'));
  const standSection = standProducts.length ? `<section class="stand-feature"><div class="stand-feature__copy reveal"><p class="eyebrow">Эксклюзивная серия</p><h2>Пальто<br><em>со стойкой</em></h2><p>Воротник-стойка, премиальная шерсть и расслабленный силуэт — отдельная серия бренда.</p><a class="button button--dark" href="/catalog.html?group=stand">Смотреть коллекцию <span>↗</span></a></div><div class="stand-feature__media reveal">${media('catalog/demi-season/stand-collar/oversize-icon/black/oversize-icon-black-video.mp4', 'OVERSIZE ICON, чёрный — видео серии пальто со стойкой')}</div></section><section class="section catalog-preview stand-models"><div class="section-head"><div><p class="eyebrow">Пальто со стойкой / ${String(standProducts.length).padStart(2, '0')}</p><h2>Модели<br><em>серии</em></h2></div><a class="underlink" href="/catalog.html?group=stand">Вся серия <span>↗</span></a></div><div class="catalog-grid catalog-grid--three">${standProducts.map((p, i) => productCard(p, i)).join('')}</div></section>` : '';
  const furSection = furProducts.length ? `<section class="stand-feature section--dark"><div class="stand-feature__copy reveal"><p class="eyebrow">Зимняя коллекция 2026–2027</p><h2>Экошубы<br><em>на зиму</em></h2><p>Мягкий тёплый мех, утеплитель и стильные силуэты — для самых уютных зимних образов.</p><a class="button button--light" href="/catalog.html?group=fur">Смотреть шубы <span>↗</span></a></div><div class="stand-feature__media reveal">${media('catalog/winter/fur-coats/fur-ostrich/black/fur-ostrich-black-01.jpg', 'Экошуба под страуса — зимняя коллекция')}</div></section><section class="section catalog-preview"><div class="section-head"><div><p class="eyebrow">Экошубы / ${String(furProducts.length).padStart(2, '0')}</p><h2>Зимние<br><em>шубы</em></h2></div><a class="underlink" href="/catalog.html?group=fur">Все шубы <span>↗</span></a></div><div class="catalog-grid catalog-grid--three">${furProducts.slice(0,3).map((p, i) => productCard(p, i)).join('')}</div></section>` : '';
  const groupsSection = `<section class="section groups-section"><div class="section-head"><div><p class="eyebrow">Категории</p><h2>Каталог<br><em>по разделам</em></h2></div><a class="underlink" href="/catalog.html">Весь каталог <span>↗</span></a></div>${groupLinks()}</section>`;
  shell(`<section class="hero"><div class="hero-copy"><div class="micro-row"><span>THE | WESHALKA</span><span>КОЛЛЕКЦИЯ</span></div><div class="hero-heading"><p class="eyebrow">Верхняя одежда / новая коллекция</p><h1>Вещи,<br><em>которые остаются</em></h1><p class="hero-lede">Пальто, пальто-халаты, экошубы и классические силуэты для осмысленного гардероба.</p></div><div class="hero-actions"><a class="button button--dark" href="/catalog.html">Смотреть каталог <span>↗</span></a><a class="underlink" href="#editorial">О бренде <span>↓</span></a></div></div><div class="hero-visual" data-hero-showcase><div class="hero-visual__frame" data-hero-frame><div data-hero-media>${media(heroColor.files[0], `${heroColor.name}, ${heroColor.label}`, 'eager', 'hero-showcase__media')}</div></div><div class="hero-visual__top"><span data-hero-title>${esc(heroColor.name || heroProduct.name)}</span><span data-hero-collection>${esc(heroProduct.collection || 'Высокий рост 170+')}</span></div><div class="hero-visual__bottom"><span data-hero-label>${esc(heroColor.label)}</span><span><span data-hero-counter></span> <b>↓</b></span></div><div class="hero-showcase__controls" data-hero-dots aria-label="Показатели слайдшоу"></div></div></section><section class="manifesto section" id="editorial"><div class="section-mark">/ 01</div><div class="manifesto-copy reveal"><p class="eyebrow">О бренде</p><h2>Точная<br><em>форма.</em><br>Спокойный<br>характер.</h2><p>THE | WESHALKA — верхняя одежда с акцентом на силуэт, фактуру и долгую актуальность.</p><a class="underlink" href="/collection.html">Смотреть коллекции <span>↗</span></a></div></section><section class="tall-feature section--brown"><div class="tall-feature__media reveal">${media('15870984347605.MP4','Видео серии для высокого роста 170+','lazy')}</div><div class="tall-feature__copy reveal"><p class="eyebrow">Для высокого роста 170+</p><h2>Длина<br><em>имеет значение.</em></h2><p>Модели длиной 120–137 см — отдельная серия для высокого роста.</p><a class="button button--light" href="/catalog.html?group=tall">Открыть коллекцию 170+ <span>↗</span></a></div></section><section class="section catalog-preview"><div class="section-head"><div><p class="eyebrow">Высокий рост 170+ / ${String(tallProducts.length).padStart(2,'0')}</p><h2>Модели<br><em>серии 170+</em></h2></div><a class="underlink" href="/catalog.html?group=tall">Вся серия <span>↗</span></a></div><div class="catalog-grid catalog-grid--three">${tallProducts.map((p, i) => productCard(p, i)).join('')}</div></section><section class="universal-feature section"><div class="universal-feature__copy reveal"><p class="eyebrow">Универсальная длина</p><h2>На любой<br><em>рост</em></h2><p>Большинство наших моделей подходят для любого роста — классическая длина, которая выглядит элегантно и пропорционально. THE | WESHALKA — не только для высоких.</p><a class="button button--dark" href="/catalog.html">Смотреть все модели <span>↗</span></a></div><div class="catalog-grid catalog-grid--three">${regularProducts.slice(0, 3).map((p, i) => productCard(p, i)).join('')}</div></section>${standSection}${furSection}${groupsSection}<section class="section catalog-preview"><div class="section-head"><div><p class="eyebrow">Избранные модели</p><h2>Силуэты<br><em>коллекции</em></h2></div><a class="underlink" href="/catalog.html">Весь каталог <span>↗</span></a></div><div class="catalog-grid">${selected.map((p, i) => productCard(p, i)).join('')}</div></section><section class="split-editorial"><div class="split-editorial__visual"><a class="editorial-image-link" href="/product.html?id=cream-icon" aria-label="Открыть CREAM ICON">${media('4A2B58C1-654E-4E09-BDDD-DF250681FF6D.WEBP','CREAM ICON — классическое пальто с золотыми акцентами')}<span class="editorial-image-link__hint">Открыть CREAM ICON ↗</span></a></div><div class="split-editorial__copy"><p class="eyebrow">Классика / 03</p><h2>Тихая<br><em>уверенность</em></h2><p>Классические модели, приталенный силуэт и пальто-халаты — в одной системе координат.</p><a class="underlink underlink--light" href="/collection.html">Изучить коллекции <span>↗</span></a></div></section><section class="reviews-preview section"><div class="section-mark">/ 04</div><div class="reviews-preview__copy"><p class="eyebrow">Отзывы</p><h2>Реальные<br><em>отзывы клиентов</em></h2><p>Покупатели делятся впечатлениями о моделях THE | WESHALKA.</p><a class="underlink" href="/reviews.html">Читать отзывы <span>↗</span></a></div></section><section class="contact-band"><div class="contact-band__meta"><span>THE | WESHALKA / 05</span><span>CONTACT</span></div><h2>Напишите<br><em>бренду.</em></h2><p>Уточнить наличие, выбрать цвет и узнать актуальные условия заказа можно в Telegram или WhatsApp.</p><div class="contact-band__buttons"><a class="contact-cta" href="https://t.me/sharp_fin" target="_blank" rel="noopener noreferrer"><span>Telegram</span><b>↗</b></a><a class="contact-cta contact-cta--wa" href="https://wa.me/79818510666" target="_blank" rel="noopener noreferrer"><span>WhatsApp *</span><b>↗</b></a></div><p class="meta-disclaimer meta-disclaimer--light">* WhatsApp — продукт Meta Platforms Inc., признанной экстремистской организацией в РФ.</p></section>`, 'Верхняя одежда');
}

function catalogPage(collectionOnly = false) {
  const heading = collectionOnly ? 'Коллекции' : 'Каталог';
  const intro = collectionOnly ? 'Классика, приталенные модели, пальто-халаты, пальто со стойкой, пальто-пиджаки, высокий рост 170+ и зимние пальто.' : 'Демисезонные и зимние пальто THE | WESHALKA. Выберите раздел и изучите модели.';
  shell(`<section class="page-hero"><p class="eyebrow">THE | WESHALKA / ${collectionOnly ? '01' : '02'}</p><h1>${heading}<br><em>${collectionOnly ? 'по форме' : 'верхней одежды'}</em></h1><p>${intro}</p></section>${collectionOnly ? `<section class="section groups-section">${groupLinks()}</section>` : ''}<section class="catalog-page section"><div class="filter-bar" aria-label="Фильтры каталога"><label>Раздел<select data-filter="group"><option value="all">Все разделы</option>${GROUPS.map((group) => `<option value="${group.id}">${esc(group.label)}</option>`).join('')}</select></label><label>Сезон<select data-filter="season"><option value="all">Все сезоны</option><option value="demi">Демисезон</option><option value="winter">Зима</option></select></label><label>Категория<select data-filter="category"><option value="all">Все категории</option><option value="Пальто">Пальто</option><option value="Пальто-халат">Пальто-халаты</option><option value="Пальто-пиджак">Пальто-пиджаки</option><option value="Экошуба">Экошубы</option></select></label><label>Силуэт<select data-filter="silhouette"><option value="all">Все силуэты</option><option value="Классический силуэт">Классика</option><option value="Приталенный силуэт">Приталенный силуэт</option><option value="Прямой крой">Прямой крой</option><option value="Relaxed fit / oversize">Relaxed fit</option></select></label><label>Коллекция<select data-filter="collection"><option value="all">Все коллекции</option><option value="Высокий рост 170+">Высокий рост 170+</option><option value="Классика">Классика</option><option value="Приталенный силуэт">Приталенный силуэт</option><option value="Пальто-халаты">Пальто-халаты</option><option value="Пальто со стойкой">Пальто со стойкой</option><option value="Пальто-пиджаки">Пальто-пиджаки</option><option value="Зимние пальто">Зимние пальто</option><option value="Экошубы">Экошубы</option></select></label><label>Рост<select data-filter="tall"><option value="all">Все модели</option><option value="yes">170+</option></select></label><label>Цена<select data-filter="price"><option value="all">Любая цена</option><option value="10000">до 10 000 ₽</option><option value="14000">до 14 000 ₽</option><option value="16000">до 16 000 ₽</option></select></label></div><p class="catalog-count" data-catalog-count></p><div class="catalog-grid" data-catalog-grid>${products.map((p, i) => productCard(p, i)).join('')}</div></section>`, heading);
  const params = new URLSearchParams(location.search); if (params.get('filter') === 'tall') $('[data-filter="tall"]').value = 'yes'; if (GROUPS.some((group) => group.id === params.get('group'))) $('[data-filter="group"]').value = params.get('group');
  const applyFilters = () => { const values = Object.fromEntries([...document.querySelectorAll('[data-filter]')].map((select) => [select.dataset.filter, select.value])); let visible = 0; document.querySelectorAll('[data-card]').forEach((card) => { const matches = Object.entries(values).every(([key, value]) => value === 'all' || (key === 'price' ? Number(card.dataset.price) > 0 && Number(card.dataset.price) <= Number(value) : key === 'group' ? card.dataset.group.split(' ').includes(value) : card.dataset[key] === value)); card.hidden = !matches; if (matches) visible += 1; }); $('[data-catalog-count]').textContent = `${visible} ${modelWord(visible)}`; };
  document.querySelectorAll('[data-filter]').forEach((select) => select.addEventListener('change', applyFilters)); applyFilters();
}

let activeProduct; let activeColor;
function productPage() {
  const id = new URLSearchParams(location.search).get('id') || 'aura';
  activeProduct = products.find((product) => product.id === id) || products[0];
  activeColor = new URLSearchParams(location.search).get('color') || firstColor(activeProduct).id;
  const color = activeProduct.colors.find((item) => item.id === activeColor) || firstColor(activeProduct); activeColor = color.id;
  const detail = `<section class="product-detail section" data-product-detail><div class="product-gallery"><div class="product-gallery__thumbs" data-gallery-thumbs>${galleryThumbs(activeProduct, color)}</div><div class="product-gallery__main" data-gallery-main>${media(color.files[0], productLabel(activeProduct), 'eager')}</div></div><div class="product-info"><a class="backlink" href="/catalog.html">← Вернуться в каталог</a><p class="eyebrow">${esc(activeProduct.collection)}${activeProduct.tall ? ' / 170+' : ''}</p><h1 data-product-name>${esc(color.name || activeProduct.name)}</h1><p class="product-subtitle" data-product-subtitle>${esc(color.title || activeProduct.title)}</p>${activeProduct.subtitle ? `<p class="product-alternative">${esc(activeProduct.subtitle)}</p>` : ''}${activeProduct.badge ? `<span class="badge badge--dark">${esc(activeProduct.badge)}</span>` : ''}<div class="product-price" data-product-price>${activeProduct.oldPrice ? `<s class="old-price old-price--dark">${esc(activeProduct.oldPrice)}</s> ` : ''}${esc(color.price || activeProduct.price || 'Цена не указана')}</div><div class="product-color"><div class="product-color__label"><span>Цвет</span><span data-color-label>${esc(color.label)}</span></div>${swatches(activeProduct, activeColor)}</div><div class="size-row"><label for="size">Размер</label><select id="size" data-size>${sizeOptions(color)}</select></div><div class="product-actions"><button class="button button--dark" type="button" data-add-to-cart>Добавить в корзину</button><a class="button button--outline" data-order-link href="${telegramLink(activeProduct, color)}" target="_blank" rel="noopener noreferrer">Уточнить наличие <span>↗</span></a></div><p class="product-note">🚚 Бесплатная доставка с примеркой по СПб &bull; 💳 Яндекс Сплит без переплаты</p><dl class="product-meta"><div><dt>Длина</dt><dd data-meta="length">${esc(color.length || activeProduct.length || 'Не указано')}</dd></div><div><dt>Состав</dt><dd data-meta="material">${esc(color.material || activeProduct.material || 'Не указан')}</dd></div><div><dt>Размеры</dt><dd data-meta="sizes">${esc(sizeText(color))}</dd></div><div><dt>Сезон</dt><dd>${esc(activeProduct.season || 'Демисезонная модель')}</dd></div></dl><div class="product-description"><p>${esc(activeProduct.description)}</p><ul data-details>${(color.details || activeProduct.details || activeProduct.tags || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div></div></section><section class="product-story section section--brown"><div><p class="eyebrow" data-story-name>${esc(color.name || activeProduct.name)}</p><h2>Форма,<br><em>которую видно.</em></h2></div><p>${esc(activeProduct.description)}${activeProduct.tall ? ' Модели серии созданы с учётом длины для роста 170+.' : ''}</p></section>`;
  shell(detail, activeProduct.name); document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => setProductColor(button.dataset.color)));
}
function colorSizes(color) { return color.sizes || activeProduct.sizes || []; }
function sizeText(color) { return colorSizes(color).join(' | ') || 'Уточняйте в Telegram'; }
function sizeOptions(color) { const sizes = colorSizes(color); return sizes.length ? `<option value="">Выберите размер</option>${sizes.map((size) => `<option value="${esc(size)}">${esc(size)}</option>`).join('')}` : '<option value="">Размеры уточняйте в Telegram</option>'; }
function galleryThumbs(product, color) {
  const files = [...(color.files || []), ...(color.video ? [color.video] : [])];
  return files.map((file, i) => `<button class="product-gallery__thumb ${i === 0 ? 'is-active' : ''}" type="button" data-gallery-thumb data-file="${esc(file)}" aria-label="${esc(`${product.name}, ${color.label}, ${isVideo(file) ? 'видео' : `кадр ${i + 1}`}`)}">${media(file, `${product.name}, ${color.label}, ${isVideo(file) ? 'видео' : `кадр ${i + 1}`}`)}</button>`).join('');
}
function bindGalleryThumbs() { document.querySelectorAll('[data-gallery-thumb]').forEach((button) => button.addEventListener('click', () => setGalleryImage(button))); }
function galleryStep(direction) { const buttons = [...document.querySelectorAll('[data-gallery-thumb]')]; if (!buttons.length) return; const active = buttons.findIndex((button) => button.classList.contains('is-active')); setGalleryImage(buttons[(active + direction + buttons.length) % buttons.length]); }
function bindProductGallery() {
  const main = $('[data-gallery-main]');
  if (!main) return;
  main.setAttribute('role', 'button');
  main.setAttribute('tabindex', '0');
  main.setAttribute('aria-label', 'Фотография модели. Нажмите справа или слева, чтобы листать.');
  bindGalleryThumbs();
  if (main.dataset.bound === 'true') return;
  main.dataset.bound = 'true';
  let pointerStartX = null;
  main.addEventListener('pointerdown', (event) => { pointerStartX = event.clientX; });
  main.addEventListener('pointerup', (event) => { if (pointerStartX === null) return; const delta = event.clientX - pointerStartX; pointerStartX = null; if (Math.abs(delta) > 40) galleryStep(delta < 0 ? 1 : -1); else galleryStep(event.clientX >= main.getBoundingClientRect().left + main.getBoundingClientRect().width * .55 ? 1 : -1); });
  main.addEventListener('pointercancel', () => { pointerStartX = null; });
  main.addEventListener('keydown', (event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); galleryStep(event.key === 'ArrowRight' ? 1 : -1); } });
}
function telegramLink(product, color) { return `https://t.me/sharp_fin?text=${encodeURIComponent(`Здравствуйте! Подскажите, пожалуйста, наличие модели ${product.name}, цвет ${color.label}.`)}`; }
function setProductColor(id) { const color = activeProduct.colors.find((item) => item.id === id); if (!color) return; activeColor = id; const main = $('[data-gallery-main]'); const thumbs = $('[data-gallery-thumbs]'); if (main) main.innerHTML = media(color.files[0], `${activeProduct.name}, ${color.label}`, 'eager'); if (thumbs) { thumbs.innerHTML = galleryThumbs(activeProduct, color); thumbs.querySelectorAll('[data-gallery-thumb]').forEach((button) => button.addEventListener('click', () => setGalleryImage(button))); } $('[data-color-label]').textContent = color.label; $('[data-product-name]').textContent = color.name || activeProduct.name; $('[data-product-subtitle]').textContent = color.title || activeProduct.title; $('[data-story-name]').textContent = color.name || activeProduct.name; $('[data-product-price]').textContent = color.price || activeProduct.price || 'Цена не указана'; $('[data-meta="length"]').textContent = color.length || activeProduct.length || 'Не указано'; $('[data-meta="material"]').textContent = color.material || activeProduct.material || 'Не указан'; $('[data-meta="sizes"]').textContent = sizeText(color); const sizeSelect = $('[data-size]'); if (sizeSelect) sizeSelect.innerHTML = sizeOptions(color); $('[data-details]').innerHTML = (color.details || activeProduct.details || activeProduct.tags || []).map((item) => `<li>${esc(item)}</li>`).join(''); $('[data-order-link]').href = telegramLink(activeProduct, color); document.querySelectorAll('[data-color]').forEach((button) => { const active = button.dataset.color === id; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); }); }
function setGalleryImage(button) { const main = $('[data-gallery-main]'); const file = button.dataset.file; if (!main || !file) return; main.innerHTML = media(file, `${activeProduct.name}, кадр галереи`, 'eager'); document.querySelectorAll('[data-gallery-thumb]').forEach((item) => item.classList.toggle('is-active', item === button)); }

function simplePage(page) {
  if (page === 'about') aboutPage();
  else if (page === 'contacts') contactsPage();
  else if (page === 'documents') documentsPage();
  else if (page === 'reviews') shell(`<section class="page-hero"><p class="eyebrow">THE | WESHALKA / 04</p><h1>Отзывы<br><em>клиентов</em></h1><p>Реальные отзывы покупателей THE | WESHALKA.</p></section><section class="reviews-page section"><div class="reviews-grid"><article class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">Заказала экошубу под страуса в белом цвете — просто влюбилась с первого взгляда! Качество на высоте, мех невероятно мягкий и тёплый. Ношу каждый день и получаю комплименты. Доставили быстро, упаковка аккуратная. Рекомендую всем!</p><div class="review-author"><strong>Мария К.</strong><span>г. Москва</span></div></article><article class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">Брала шубку под песца в бежевом — размер 44, подошёл идеально. Утеплитель очень тёплый, даже в -20 было комфортно. Силуэт красивый, не утяжеляет фигуру. Очень довольна покупкой, спасибо магазину за оперативность!</p><div class="review-author"><strong>Алина В.</strong><span>г. Санкт-Петербург</span></div></article><article class="review-card"><div class="review-stars">★★★★★</div><p class="review-text">Купила шубку в стиле ОЛД МАНИ — давно мечтала о такой вещи. Качество превзошло ожидания за такую цену. Продавец была очень внимательна, помогла с выбором размера. Уже посоветовала подруге, она тоже заказала!</p><div class="review-author"><strong>Екатерина С.</strong><span>г. Екатеринбург</span></div></article></div><a class="button button--dark" href="https://t.me/sharp_fin" target="_blank" rel="noopener noreferrer" style="margin-top:2rem">Написать в Telegram <span>↗</span></a></section>`, 'Отзывы');
}

function aboutPage() {
  shell(`<section class="page-hero page-hero--warm"><p class="eyebrow">THE | WESHALKA</p><h1>О нас</h1><p>Верхняя одежда, в которую влюбляешься с первого взгляда.</p></section>
<section class="about-content section">
<div class="about-intro reveal">
<p>Добро пожаловать в наш шоурум женской верхней одежды в самом центре Санкт-Петербурга.</p>
<p>Мы создаём коллекции для тех, кто хочет выглядеть стильно без лишних усилий. Пальто и экошубы, которые легко становятся основой гардероба, сочетаются с любимыми образами и помогают создавать тот самый effortless look.</p>
<p>Мы тщательно выбираем актуальные фасоны, качественные материалы и выразительные силуэты, чтобы верхняя одежда не просто красиво выглядела, а действительно украшала образ и была комфортной каждый день.</p>
</div>

<div class="about-features reveal">
<h2>Почему<br><em>нас выбирают?</em></h2>
<div class="features-grid">
<div class="feature-card"><span class="feature-icon">✦</span><h3>Актуальные модели</h3><p>Современный дизайн, который легко вписывается в гардероб</p></div>
<div class="feature-card"><span class="feature-icon">✦</span><h3>Большой выбор</h3><p>Пальто, экошубы и верхняя одежда на разные сезоны и образы</p></div>
<div class="feature-card"><span class="feature-icon">✦</span><h3>Качественные материалы</h3><p>Внимание к посадке, деталям и комфорту</p></div>
<div class="feature-card"><span class="feature-icon">✦</span><h3>Российское производство</h3><p>Делаем ставку на качество и актуальный дизайн</p></div>
<div class="feature-card"><span class="feature-icon">✦</span><h3>Примерка в шоуруме</h3><p>Можно увидеть модель вживую и выбрать ту самую</p></div>
</div>
</div>
</section>

<section class="about-showroom section section--brown">
<div class="showroom-info reveal">
<p class="eyebrow">Примерить и купить</p>
<h2>Шоурум<br><em>в Петербурге</em></h2>
<div class="showroom-details">
<div class="showroom-detail"><strong>📍 Адрес</strong><p>Санкт-Петербург, ул. Садовая, 26Б<br>м. Гостиный двор</p></div>
<div class="showroom-detail"><strong>🕒 Режим работы</strong><p>Ежедневно с 12:00 до 20:00<br>Без перерыва и выходных</p></div>
<div class="showroom-detail"><strong>🚶 Как нас найти</strong><p>Заходите в железную чёрную арку под вывеской «Садовая 26» «Военторг» и налево к угловой чёрной двери около клумб с цветами. В домофон набираете «ВЕШАЛКА студия пальто».</p></div>
</div>
<p>Приезжайте в шоурум, чтобы посмотреть коллекцию вживую, примерить разные модели и найти своё идеальное пальто или экошубу.</p>
<p>Не знаете, какую модель выбрать? Мы поможем подобрать верхнюю одежду под ваш стиль, гардероб и образ жизни.</p>
</div>
</section>

<section class="about-delivery section">
<div class="delivery-grid reveal">
<div class="delivery-card"><strong>🚚 Бесплатная доставка</strong><p>С примеркой по Санкт-Петербургу</p></div>
<div class="delivery-card"><strong>💳 Яндекс Сплит</strong><p>Оплата без переплаты — делите на части</p></div>
</div>
</section>

<section class="about-social section">
<div class="reveal">
<h2>Будьте<br><em>с нами</em></h2>
<p>Следите за новинками, новыми поступлениями, образами и актуальными моделями в наших социальных сетях.</p>
<div class="about-social-links">
<a class="contact-cta" href="https://vk.ru/club161262776" target="_blank" rel="noopener noreferrer"><span>ВКонтакте</span><b>↗</b></a>
<a class="contact-cta contact-cta--secondary" href="https://t.me/The_weshalka" target="_blank" rel="noopener noreferrer"><span>Telegram</span><b>↗</b></a>
</div>
<p style="margin-top:1.5rem;color:var(--muted);font-size:13px">Подписывайтесь, чтобы первыми узнавать о новых моделях пальто и экошуб, поступлениях и коллекциях.</p>
</div>
</section>

<section class="about-legal section">
<div class="reveal">
<p class="eyebrow">Реквизиты</p>
<p>ИП Гриднева Гулафруз<br>ИНН 745211657800<br>ОГРНИП 318784700342204</p>
</div>
</section>`, 'О нас');
}

function contactsPage() {
  shell(`<section class="contact-page section section--brown"><p class="eyebrow">THE | WESHALKA / 05</p><h1>Контакты</h1><p>Уточнить наличие, выбрать цвет и узнать актуальные условия заказа.</p>

<div class="contact-showroom">
<div class="showroom-block">
<h2 style="font-size:clamp(32px,5vw,48px)">Шоурум</h2>
<div class="showroom-details showroom-details--light">
<div class="showroom-detail"><strong>📍 Адрес</strong><p>Санкт-Петербург, ул. Садовая, 26Б<br>м. Гостиный двор</p></div>
<div class="showroom-detail"><strong>🕒 Режим работы</strong><p>Ежедневно с 12:00 до 20:00<br>Без перерыва и выходных</p></div>
<div class="showroom-detail"><strong>🚶 Как нас найти</strong><p>Заходите в железную чёрную арку под вывеской «Садовая 26» «Военторг» и налево к угловой чёрной двери около клумб с цветами. В домофон набираете «ВЕШАЛКА студия пальто».</p></div>
</div>
</div>
</div>

<div class="contact-links"><a class="contact-cta" href="https://t.me/sharp_fin" target="_blank" rel="noopener noreferrer"><span>Написать в Telegram</span><b>↗</b></a><a class="contact-cta contact-cta--secondary" href="https://wa.me/79818510666" target="_blank" rel="noopener noreferrer"><span>Написать в WhatsApp *</span><b>↗</b></a></div>
<div class="contact-socials"><a href="https://t.me/The_weshalka" target="_blank" rel="noopener noreferrer" class="contact-social-link">Telegram-канал ↗</a><a href="https://vk.ru/club161262776" target="_blank" rel="noopener noreferrer" class="contact-social-link">ВКонтакте ↗</a></div>
<p class="meta-disclaimer">* WhatsApp — продукт компании Meta Platforms Inc., признанной экстремистской организацией на территории Российской Федерации.</p></section>`, 'Контакты');
}

function documentsPage() {
  shell(`<section class="page-hero"><p class="eyebrow">THE | WESHALKA</p><h1>Документы</h1><p>Правовая информация и документы ИП Гриднева Гулафруз.</p></section>
<section class="documents-page section">
<div class="documents-grid">
<a class="document-card" href="/docs/politika-konfidencialnosti.pdf" target="_blank" rel="noopener noreferrer">
<span class="doc-icon">📄</span>
<div><strong>Политика конфиденциальности</strong><p>Порядок обработки и защиты персональных данных</p></div>
</a>
<a class="document-card" href="/docs/soglasie-na-obrabotku-pd.pdf" target="_blank" rel="noopener noreferrer">
<span class="doc-icon">📄</span>
<div><strong>Согласие на обработку персональных данных</strong><p>Форма согласия пользователя сайта</p></div>
</a>
<a class="document-card" href="/docs/instrukcia-otvetstvennogo-lica.pdf" target="_blank" rel="noopener noreferrer">
<span class="doc-icon">📄</span>
<div><strong>Инструкция ответственного лица</strong><p>Инструкция ответственного за обработку персональных данных</p></div>
</a>
<a class="document-card" href="/docs/prikaz-o-naznachenii-otvetstvennogo.pdf" target="_blank" rel="noopener noreferrer">
<span class="doc-icon">📄</span>
<div><strong>Приказ о назначении ответственного лица</strong><p>О назначении лица, ответственного за организацию обработки персональных данных</p></div>
</a>
</div>
<div class="documents-note">
<p>Все документы доступны для ознакомления и скачивания в формате PDF.</p>
<p>По вопросам обработки персональных данных обращайтесь: <strong>gridnevagulya@gmail.com</strong></p>
</div>
</section>`, 'Документы');
}

async function init() { try { loadCart(); const response = await fetch('/data/products.json'); products = await response.json(); collectPosters(); bindVideoFallback(); const page = document.body.dataset.page; if (page === 'home') homePage(); else if (page === 'catalog') catalogPage(false); else if (page === 'collection') catalogPage(true); else if (page === 'product') productPage(); else simplePage(page); } catch (error) { console.error('THE | WESHALKA data error', error); document.body.innerHTML = '<main class="error-page"><h1>Каталог временно недоступен</h1><a href="/">Вернуться на главную</a></main>'; } }
document.addEventListener('DOMContentLoaded', init);
