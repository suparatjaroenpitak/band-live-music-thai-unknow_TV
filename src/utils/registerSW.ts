const EXPECTED_CACHE = "smart-music-studio-v2";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.filter((k) => k !== EXPECTED_CACHE).forEach((k) => caches.delete(k));
    }).catch(() => undefined);
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const reg of registrations) {
          if (reg.active && reg.active.scriptURL !== new URL("/sw.js", location.origin).href) {
            reg.unregister().catch(() => undefined);
          }
        }
      })
      .catch(() => undefined);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch(() => undefined);
  });
}
