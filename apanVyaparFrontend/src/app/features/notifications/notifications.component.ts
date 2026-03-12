import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Notification } from '../../core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  unreadCount = signal(0);

  // Filter state
  showUnreadOnly = signal(false);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    // Get all notifications - API doesn't require userId parameter
    this.apiService.getNotifications().subscribe({
      next: (response) => {
        // Handle both paginated and direct array responses
        let notifications: Notification[] = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            notifications = response.data;
          } else if ((response.data as any).items) {
            notifications = (response.data as any).items;
          }
        }
        
        this.notifications.set(notifications);
        this.updateUnreadCount();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load notifications');
        this.loading.set(false);
      }
    });
  }

  updateUnreadCount(): void {
    const unread = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(unread);
  }

  toggleUnreadFilter(): void {
    this.showUnreadOnly.update(v => !v);
  }

  get filteredNotifications(): Notification[] {
    if (this.showUnreadOnly()) {
      return this.notifications().filter(n => !n.isRead);
    }
    return this.notifications();
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;

    this.apiService.markNotificationRead(notification.id).subscribe({
      next: (response) => {
        // Update local state
        const updated = this.notifications().map(n => 
          n.id === notification.id 
            ? { ...n, isRead: true, readAt: new Date().toISOString() } 
            : n
        );
        this.notifications.set(updated);
        this.updateUnreadCount();
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
      }
    });
  }

  markAllAsRead(): void {
    // Mark all notifications as read - API doesn't require userId
    this.apiService.markAllNotificationsRead().subscribe({
      next: (response) => {
        // Update all notifications to read
        const updated = this.notifications().map(n => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString()
        }));
        this.notifications.set(updated);
        this.updateUnreadCount();
      },
      error: (err) => {
        console.error('Failed to mark all as read:', err);
      }
    });
  }

  getNotificationIcon(type: string | undefined): string {
    switch (type) {
      case 'Order': return '📦';
      case 'Stock': return '📊';
      case 'Payment': return '💰';
      case 'System': return '🔔';
      default: return '🔔';
    }
  }

  getPriorityClass(priority: string | undefined): string {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Urgent': return 'priority-urgent';
      case 'Normal': return 'priority-normal';
      case 'Low': return 'priority-low';
      default: return '';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  onNotificationClick(notification: Notification): void {
    this.markAsRead(notification);
    
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }
}

