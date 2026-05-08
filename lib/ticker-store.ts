export interface TickerPayload {
  ticker: string;
  name?: string;
  price?: number;
  changePct?: number;
  sector?: string;
  source?: string;
  exchange?: string;
}

export interface TickerState {
  ticker: TickerPayload | null;
}

class TickerStoreImpl {
  private listeners = new Set<(state: TickerState) => void>();
  private state: TickerState = { ticker: null };

  open(payload: TickerPayload) {
    this.state = { ticker: payload };
    this.notify();
  }

  close() {
    this.state = { ticker: null };
    this.notify();
  }

  subscribe(fn: (state: TickerState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  getState(): TickerState {
    return this.state;
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.state));
  }
}

const tickerStore = new TickerStoreImpl();
export default tickerStore;
