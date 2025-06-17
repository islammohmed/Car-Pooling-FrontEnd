import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../model/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', options?: { duration: number }) {
    const notification: Notification = {
      id: this.generateId(),
      message,
      type,
      duration: options?.duration || 5000
    };

    const currentNotifications = this.notifications.value;
    this.notifications.next([...currentNotifications, notification]);

    // Auto remove after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
  }

  remove(id: string) {
    const currentNotifications = this.notifications.value;
    this.notifications.next(currentNotifications.filter(n => n.id !== id));
  }

  clear() {
    this.notifications.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Convenience methods
  success(message: string, options?: { duration: number }) {
    this.show(message, 'success', options);
  }

  error(message: string, options?: { duration: number }) {
    this.show(message, 'error', options);
  }

  warning(message: string, options?: { duration: number }) {
    this.show(message, 'warning', options);
  }

  info(message: string, options?: { duration: number }) {
    this.show(message, 'info', options);
  }
}