/**
 * Per-provider circuit. After consecutive failures the next calls fail closed until the
 * cooldown elapses. Does not fail over to a different supplier.
 */

export interface CircuitState {
  name: string;
  open: boolean;
  failures: number;
  openUntil: number;
}

const DEFAULT_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MS = 30_000;

class Circuit {
  failures = 0;
  openUntil = 0;

  constructor(
    readonly name: string,
    private readonly threshold = DEFAULT_THRESHOLD,
    private readonly cooldownMs = DEFAULT_COOLDOWN_MS,
    private readonly now: () => number = Date.now,
  ) {}

  allow(): boolean {
    if (this.openUntil > this.now()) return false;
    if (this.openUntil !== 0 && this.openUntil <= this.now()) {
      this.openUntil = 0;
      this.failures = 0;
    }
    return true;
  }

  success(): void {
    this.failures = 0;
    this.openUntil = 0;
  }

  failure(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openUntil = this.now() + this.cooldownMs;
    }
  }

  snapshot(): CircuitState {
    return {
      name: this.name,
      open: !this.allow() && this.openUntil > this.now(),
      failures: this.failures,
      openUntil: this.openUntil,
    };
  }
}

const circuits = new Map<string, Circuit>();

export function circuitFor(
  name: string,
  options: { threshold?: number; cooldownMs?: number; now?: () => number } = {},
): Circuit {
  const existing = circuits.get(name);
  if (existing && !options.now) return existing;
  const created = new Circuit(name, options.threshold, options.cooldownMs, options.now);
  if (!options.now) circuits.set(name, created);
  return created;
}

export function resetCircuits(): void {
  circuits.clear();
}
