// Push Notification and Browser Notification Manager
export class NotificationManager {
  private static instance: NotificationManager;

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async sendLocalNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('Notification permission not granted:', Notification.permission);
      return false;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        return true;
      } else {
        new Notification(title, options);
        return true;
      }
    } catch (err) {
      console.error('Failed to show notification:', err);
      // Fallback
      new Notification(title, options);
      return true;
    }
  }

  public scheduleDeadlineCheck(
    deadlines: { id: string; title: string; courseName: string; dueDate: string; completed?: boolean; notifyEnabled?: boolean }[]
  ) {
    if (this.getPermissionStatus() !== 'granted') return;

    const now = Date.now();
    deadlines.forEach((dl) => {
      if (dl.completed || dl.notifyEnabled === false) return;
      const dueTime = new Date(dl.dueDate).getTime();
      const hoursRemaining = (dueTime - now) / (1000 * 60 * 60);

      // Alert if due within 48 hours and hasn't been notified yet in this session
      if (hoursRemaining > 0 && hoursRemaining <= 48) {
        const alertKey = `notified_dl_${dl.id}`;
        if (!sessionStorage.getItem(alertKey)) {
          this.sendLocalNotification(`⏳ Upcoming Deadline: ${dl.title}`, {
            body: `${dl.courseName} is due in ${Math.round(hoursRemaining)} hours! Don't forget to study.`,
            tag: `deadline-${dl.id}`
          });
          sessionStorage.setItem(alertKey, 'true');
        }
      }
    });
  }
}

export const notificationManager = NotificationManager.getInstance();
