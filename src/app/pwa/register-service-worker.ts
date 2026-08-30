import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
  return registerSW({
    immediate: false,
    onRegisterError(error) {
      console.error('Uangara service worker registration failed.', error)
    },
  })
}
