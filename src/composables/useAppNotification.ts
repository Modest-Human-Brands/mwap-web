import { useWebNotification, type UseWebNotificationOptions } from '@vueuse/core'

export interface NotificationPayload {
  title?: string
  body?: string
  icon?: string
  dir?: 'auto' | 'ltr' | 'rtl'
  lang?: string
  tag?: string
}

/**
 * Manages Web Notifications using VueUse useWebNotification.
 */
export function useAppNotification(initialOptions: UseWebNotificationOptions = {}) {
  const { isSupported, notification, show, close, onClick, onShow, onError, onClose } =
    useWebNotification({
      title: 'MWap',
      body: 'Notification enabled successfully!',
      icon: '/pwa/pwa-192x192.png',
      dir: 'auto',
      lang: 'en',
      renotify: true,
      tag: 'vuetemplate-notification',
      ...initialOptions,
    })

  const sendNotification = async (payload?: NotificationPayload) => {
    if (!isSupported.value) {
      console.warn('Web Notifications are not supported in this environment.')
      return
    }

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          console.warn('Notification permission was not granted:', permission)
          return
        }
      }

      if (Notification.permission === 'granted') {
        if (payload) {
          return new Notification(payload.title ?? 'MWap', {
            body: payload.body ?? 'Notification alert!',
            icon: payload.icon ?? '/pwa/pwa-192x192.png',
            dir: payload.dir ?? 'auto',
            lang: payload.lang ?? 'en',
            tag: payload.tag ?? 'vuetemplate-notification',
          })
        }
        await show()
      }
    }
  }

  return {
    isSupported,
    notification,
    show,
    close,
    sendNotification,
    onClick,
    onShow,
    onError,
    onClose,
  }
}