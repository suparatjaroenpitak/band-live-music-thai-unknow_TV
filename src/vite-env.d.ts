/// <reference types="vite/client" />

interface ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}
