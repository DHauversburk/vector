import { mockStore } from '../mockStore'
import type { Notification } from '../types'
import type { INotificationActions } from '../interfaces'

export const mockNotifications: INotificationActions = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    await mockStore.load()
    return mockStore.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    await mockStore.load()
    const n = mockStore.notifications.find((n) => n.id === notificationId)
    if (n) {
      n.read = true
      await mockStore.save()
    }
  },

  markAllNotificationsRead: async (userId: string): Promise<void> => {
    await mockStore.load()
    mockStore.notifications
      .filter((n) => n.user_id === userId)
      .forEach((n) => {
        n.read = true
      })
    await mockStore.save()
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    await mockStore.load()
    return mockStore.notifications.filter((n) => n.user_id === userId && !n.read).length
  },
}
