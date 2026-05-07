import type { UnifiedEvent, EventDateRange } from "../EventAggregatorService";

export type { EventDateRange };

/**
 * Common interface every event-source adapter must implement.
 * All adapters run server-side (access to process.env).
 */
export interface EventSourceAdapter {
  /** Unique adapter key (matches keys in EventSourceRegistry) */
  readonly name: string;
  /** Fetch events for a city/country + date window. Never throws — returns [] on error. */
  fetch(city: string, countryCode: string, dateRange: EventDateRange): Promise<UnifiedEvent[]>;
  /** True when required API credentials exist in process.env */
  isAvailable(): boolean;
}
