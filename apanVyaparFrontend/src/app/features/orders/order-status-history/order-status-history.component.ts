import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, OrderStatusHistory } from '../../../core/services/order.service';
import { StatusHelperService, ORDER_STATUSES, PAYMENT_STATUSES } from '../../../core/services/status-helper.service';

@Component({
  selector: 'app-order-status-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-history-container">
      <!-- Header -->
      <div class="history-header">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Status History
        </h3>
        <div class="history-tabs">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'ORDER_STATUS'"
            (click)="loadHistory('ORDER_STATUS')">
            Order Status
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'PAYMENT_STATUS'"
            (click)="loadHistory('PAYMENT_STATUS')">
            Payment Status
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner-small"></div>
        <span>Loading history...</span>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && history().length === 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p>No status history available</p>
      </div>

      <!-- Timeline -->
      <div class="timeline" *ngIf="!loading() && history().length > 0">
        <div class="timeline-item" *ngFor="let item of history(); let first = first; let last = last" [class.first]="first" [class.last]="last">
          <!-- Timeline Dot -->
          <div class="timeline-dot" [class]="getStatusClass(item.newStatus || '')">
            <span class="dot-icon">{{ getStatusIcon(item.newStatus || '', item.type || '') }}</span>
          </div>
          
          <!-- Timeline Line -->
          <div class="timeline-line" *ngIf="!last"></div>
          
          <!-- Timeline Content -->
          <div class="timeline-content">
            <div class="status-change">
              <span class="old-status" [class]="getStatusClass(item.oldStatus || '')">
                {{ item.oldStatus ? formatStatus(item.oldStatus) : 'None' }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="arrow">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
              <span class="new-status" [class]="getStatusClass(item.newStatus || '')">
                {{ formatStatus(item.newStatus || '') }}
              </span>
            </div>
            
            <div class="change-meta">
              <span class="changed-by" *ngIf="item.changedBy">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {{ item.changedBy }}
              </span>
              <span class="change-date">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {{ item.createdAt | date:'medium' }}
              </span>
            </div>
            
            <div class="change-reason" *ngIf="item.reason">
              <span class="reason-label">Reason:</span>
              {{ item.reason }}
            </div>
            
            <div class="change-notes" *ngIf="item.notes">
              <span class="notes-label">Notes:</span>
              {{ item.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-history-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    /* Header */
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      flex-wrap: wrap;
      gap: 12px;
    }

    .history-header h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .history-header h3 svg {
      color: #3b82f6;
    }

    .history-tabs {
      display: flex;
      gap: 4px;
      background: #e2e8f0;
      padding: 4px;
      border-radius: 8px;
    }

    .tab-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #1e293b;
    }

    .tab-btn.active {
      background: white;
      color: #3b82f6;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Loading State */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px 20px;
      color: #64748b;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .empty-state svg {
      color: #cbd5e1;
      margin-bottom: 12px;
    }

    .empty-state p {
      margin: 0;
      color: #94a3b8;
      font-size: 14px;
    }

    /* Timeline */
    .timeline {
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
    }

    .timeline-item {
      display: flex;
      gap: 16px;
      position: relative;
      padding-bottom: 24px;
    }

    .timeline-item.last {
      padding-bottom: 0;
    }

    /* Timeline Dot */
    .timeline-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f1f5f9;
      flex-shrink: 0;
      z-index: 1;
    }

    .timeline-dot.draft { background: #f3f4f6; }
    .timeline-dot.pending, .timeline-dot.unpaid { background: #fef3c7; }
    .timeline-dot.confirmed, .timeline-dot.partially_paid { background: #dbeafe; }
    .timeline-dot.processing { background: #ede9fe; }
    .timeline-dot.shipped { background: #e0e7ff; }
    .timeline-dot.delivered, .timeline-dot.completed, .timeline-dot.paid { background: #d1fae5; }
    .timeline-dot.cancelled, .timeline-dot.failed { background: #fee2e2; }
    .timeline-dot.returned { background: #ffedd5; }

    .dot-icon {
      font-size: 16px;
    }

    /* Timeline Line */
    .timeline-line {
      position: absolute;
      left: 19px;
      top: 40px;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }

    /* Timeline Content */
    .timeline-content {
      flex: 1;
      min-width: 0;
    }

    .status-change {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .old-status, .new-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .old-status.draft, .new-status.draft { background: #f3f4f6; color: #6b7280; }
    .old-status.pending, .new-status.pending, 
    .old-status.unpaid, .new-status.unpaid { background: #fef3c7; color: #92400e; }
    .old-status.confirmed, .new-status.confirmed,
    .old-status.partially_paid, .new-status.partially_paid { background: #dbeafe; color: #1e40af; }
    .old-status.processing, .new-status.processing { background: #ede9fe; color: #5b21b6; }
    .old-status.shipped, .new-status.shipped { background: #e0e7ff; color: #4338ca; }
    .old-status.delivered, .new-status.delivered,
    .old-status.completed, .new-status.completed,
    .old-status.paid, .new-status.paid { background: #d1fae5; color: #065f46; }
    .old-status.cancelled, .new-status.cancelled,
    .old-status.failed, .new-status.failed { background: #fee2e2; color: #991b1b; }
    .old-status.returned, .new-status.returned { background: #ffedd5; color: #c2410c; }

    .arrow {
      color: #94a3b8;
    }

    .change-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .changed-by, .change-date {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #64748b;
    }

    .change-reason, .change-notes {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .reason-label, .notes-label {
      font-weight: 600;
      color: #1e293b;
      margin-right: 4px;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .history-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .history-tabs {
        width: 100%;
      }

      .tab-btn {
        flex: 1;
        text-align: center;
      }

      .timeline-dot {
        width: 32px;
        height: 32px;
      }

      .timeline-line {
        left: 15px;
      }

      .status-change {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .arrow {
        transform: rotate(90deg);
      }
    }
  `]
})
export class OrderStatusHistoryComponent implements OnInit {
  @Input() orderId: string = '';
  @Input() initialTab: 'ORDER_STATUS' | 'PAYMENT_STATUS' = 'ORDER_STATUS';

  private orderService = inject(OrderService);
  private statusHelper = inject(StatusHelperService);

  history = signal<OrderStatusHistory[]>([]);
  loading = signal(false);
  activeTab = signal<'ORDER_STATUS' | 'PAYMENT_STATUS'>('ORDER_STATUS');

  ngOnInit(): void {
    this.activeTab.set(this.initialTab);
    this.loadHistory(this.initialTab);
  }

  loadHistory(type: 'ORDER_STATUS' | 'PAYMENT_STATUS'): void {
    this.activeTab.set(type);
    this.loading.set(true);

    this.orderService.getOrderStatusHistory(this.orderId, type).subscribe({
      next: (response) => {
        this.history.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.history.set([]);
        this.loading.set(false);
      }
    });
  }

  formatStatus(status?: string): string {
    return this.statusHelper.formatStatus(status || '');
  }

  getStatusClass(status?: string): string {
    return status?.toLowerCase() || '';
  }

  getStatusIcon(status?: string, type?: string): string {
    if (type === 'PAYMENT_STATUS') {
      return this.statusHelper.getPaymentStatusIcon(status || '');
    }
    return this.statusHelper.getOrderStatusIcon(status || '');
  }
}

