import { EventEmitter } from "events";

// In-process realtime event bus. The Next.js app runs as a single Node
// server, so a plain EventEmitter is sufficient to fan events out to SSE
// clients without extra infrastructure. Swappable later for Supabase
// Realtime / a Postgres LISTEN/NOTIFY bridge without touching callers.

export type RealtimeEvent = {
  type: string;
  payload: unknown;
};

class RealtimeBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  publish(userId: string, event: RealtimeEvent) {
    this.emit(`user:${userId}`, event);
  }

  subscribeUser(userId: string, listener: (event: RealtimeEvent) => void) {
    const channel = `user:${userId}`;
    this.on(channel, listener);
    return () => this.off(channel, listener);
  }
}

const globalForBus = globalThis as unknown as { __fcpRealtimeBus?: RealtimeBus };

export const realtimeBus = globalForBus.__fcpRealtimeBus ?? new RealtimeBus();
if (process.env.NODE_ENV !== "production") globalForBus.__fcpRealtimeBus = realtimeBus;
