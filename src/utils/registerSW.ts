export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.sync?.register("studio-project-sync").catch(() => undefined))
      .catch(() => undefined);
  });
}
