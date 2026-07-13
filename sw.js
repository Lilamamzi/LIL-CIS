// نکته: هر بار که فایل‌ها رو آپدیت کردید، این ورژن رو عوض کنید
// تا کاربرهای نصب‌شده نسخه قدیمی cache شده رو نبینن.
const CACHE_VERSION = "lilcis-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./ui.js",
  "./data.js",
  "./charts.js",
  "./ocr.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // فقط شل اپ رو cache می‌کنیم؛ برای بقیه (مثلا Tesseract CDN) شبکه اولویت داره
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
