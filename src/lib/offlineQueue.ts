export interface QueuedAction {
  id: string;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT';
  payload: any;
  timestamp: string;
}

const STORAGE_KEY = 'krishilink_offline_queue';

class OfflineQueue {
  private queue: QueuedAction[] = [];
  private listeners: ((count: number) => void)[] = [];

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue();
      });
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (e) {
      console.error('Error saving offline queue', e);
    }
  }

  public enqueue(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
    const item: QueuedAction = {
      ...action,
      id: 'offline_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    this.queue.push(item);
    this.saveToStorage();
    return item.id;
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  public subscribe(listener: (count: number) => void) {
    this.listeners.push(listener);
    listener(this.getPendingCount());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getPendingCount()));
  }

  public async processQueue(): Promise<number> {
    if (this.queue.length === 0) return 0;
    const count = this.queue.length;
    // Simulate flushing items
    await new Promise((r) => setTimeout(r, 600));
    this.queue = [];
    this.saveToStorage();
    return count;
  }
}

export const offlineQueue = new OfflineQueue();
