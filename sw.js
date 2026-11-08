/**
 * Offline service worker for fx-991ES PLUS 2nd edition web re-creation.
 * - Cache-first for same-origin GETs, refreshing the cached copy in the background.
 * - On localhost it is network-first (so code edits show up at once) and the cache is the offline fallback.
 * - Pre-caches the complete application shell, UI, LCD rendering assets, and core modules.
 * - The page also posts every URL it loaded ({type:'cache-urls'}) so any dynamically loaded URLs are cached.
 * Bump VERSION to drop old caches.
 */

const VERSION = 'v4-es';
const CACHE = `fx991es-${VERSION}`;
const DEV_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
const NETWORK_FIRST = DEV_HOSTS.includes(self.location.hostname);

const SHELL = [
  './',
  'index.html',
  'popout.html',
  'manifest.webmanifest',
  'css/calculator.css',
  'assets/faceplate/faceplate.svg',
  'assets/images/faceplate.png',
  'assets/data/key_layout.json',
  'assets/data/lcd_config.json',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'js/app.js',
  'js/keypad.js',
  'js/popout.js',
  'js/lcd/canvas_lcd.js',
  'js/lcd/layout.js',
  'js/lcd/natural_display.js',
  'js/lcd/raster.js',
  'js/lcd/fonts/large.js',
  'js/lcd/fonts/small.js',
  'js/lcd/fonts/lcd_main.js',
  'js/lcd/fonts/lcd_small.js',
  'js/lcd/fonts/lcd_status.js',
  'js/core/Calculator.js',
  'js/core/errors.js',
  'js/core/keys.js',
  'js/core/memory.js',
  'js/core/setup.js',
  'js/core/apps/CalcApp.js',
  'js/core/apps/calcSolve.js',
  'js/core/apps/RecallView.js',
  'js/core/apps/systemViews.js',
  'js/core/data/constants.js',
  'js/core/data/conversions.js',
  'js/core/eval/calculus.js',
  'js/core/eval/evaluate.js',
  'js/core/exact/DMSForm.js',
  'js/core/exact/ExactValue.js',
  'js/core/exact/PiForm.js',
  'js/core/exact/Rational.js',
  'js/core/exact/SurdForm.js',
  'js/core/format/display.js',
  'js/core/format/formatNumber.js',
  'js/core/format/ResultView.js',
  'js/core/input/Editor.js',
  'js/core/input/keyInput.js',
  'js/core/input/tokens.js',
  'js/core/modes/registry.js',
  'js/core/modes/baseN/BaseNApp.js',
  'js/core/modes/baseN/BaseNEvaluator.js',
  'js/core/modes/baseN/BaseNValue.js',
  'js/core/modes/baseN/index.js',
  'js/core/modes/complex/ComplexApp.js',
  'js/core/modes/complex/ComplexEvaluator.js',
  'js/core/modes/complex/ComplexValue.js',
  'js/core/modes/complex/index.js',
  'js/core/modes/equation/EquationApp.js',
  'js/core/modes/equation/solver.js',
  'js/core/modes/equation/index.js',
  'js/core/modes/matrix/Matrix.js',
  'js/core/modes/matrix/MatrixEvaluator.js',
  'js/core/modes/matrix/MatrixViews.js',
  'js/core/modes/matrix/index.js',
  'js/core/modes/statistics/StatApp.js',
  'js/core/modes/statistics/StatCalcApp.js',
  'js/core/modes/statistics/StatEditorView.js',
  'js/core/modes/statistics/StatModel.js',
  'js/core/modes/statistics/StatResultView.js',
  'js/core/modes/statistics/tokens.js',
  'js/core/modes/statistics/index.js',
  'js/core/modes/table/cells.js',
  'js/core/modes/table/index.js',
  'js/core/modes/vector/VectorApp.js',
  'js/core/modes/vector/VectorEvaluator.js',
  'js/core/modes/vector/VectorValue.js',
  'js/core/modes/vector/VectorViews.js',
  'js/core/modes/vector/index.js',
  'js/core/number/Decimal15.js',
  'js/core/number/functions.js',
  'js/core/number/Rational.js',
  'js/core/parse/parser.js',
  'js/core/qr/qrcode.js',
  'js/core/ui/Screen.js',
  'js/core/ui/views.js'
];

// Each file is added on its own so one missing file can't break installation.
const addAll = (cache, urls) => Promise.all(urls.map((u) => cache.add(u).catch(() => {})));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => addAll(c, SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith('fx991ex-') || key.startsWith('fx991es-')) && key !== CACHE) {
        await caches.delete(key);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-urls' || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((u) => typeof u === 'string' && u.startsWith(self.location.origin));
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    const missing = [];
    for (const u of urls) if (!(await cache.match(u, { ignoreSearch: true }))) missing.push(u);
    await addAll(cache, missing);
  }));
});

async function fromNetwork(request) {
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, res.clone());
  }
  return res;
}

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const match = await cache.match(request, { ignoreSearch: true });
  if (match) return match;
  if (request.mode === 'navigate') {
    const url = new URL(request.url);
    if (url.pathname.endsWith('popout.html')) {
      return (await cache.match('popout.html')) || (await cache.match('./popout.html'));
    }
    return (await cache.match('index.html')) || (await cache.match('./index.html')) || (await cache.match('./'));
  }
  return undefined;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (NETWORK_FIRST) {
    event.respondWith(fromNetwork(request).catch(async () => (await fromCache(request)) || Response.error()));
    return;
  }

  event.respondWith((async () => {
    const cached = await fromCache(request);
    const refresh = fromNetwork(request);
    if (cached) {
      event.waitUntil(refresh.catch(() => {}));
      return cached;
    }
    return refresh.catch(async () => (await fromCache(request)) || Response.error());
  })());
});
