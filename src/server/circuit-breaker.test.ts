import { describe, expect, it } from 'vitest';
import { circuitFor } from '@/server/circuit-breaker';

describe('circuitFor', () => {
  it('opens after consecutive failures and closes after the cooldown', () => {
    let now = 1_000;
    const circuit = circuitFor('probe', { threshold: 3, cooldownMs: 100, now: () => now });
    expect(circuit.allow()).toBe(true);
    circuit.failure();
    circuit.failure();
    expect(circuit.allow()).toBe(true);
    circuit.failure();
    expect(circuit.allow()).toBe(false);
    now += 101;
    expect(circuit.allow()).toBe(true);
  });

  it('resets on success so a later failure does not trip immediately', () => {
    const circuit = circuitFor(`probe-ok-${Math.random()}`, { threshold: 2, cooldownMs: 1_000 });
    circuit.failure();
    circuit.success();
    circuit.failure();
    expect(circuit.allow()).toBe(true);
  });
});
