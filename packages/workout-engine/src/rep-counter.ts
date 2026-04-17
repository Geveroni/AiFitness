type Phase = "up" | "down";

/**
 * Simple state machine rep counter.
 * Tracks whether user is in the "up" or "down" phase of an exercise
 * based on a primary joint angle crossing thresholds.
 */
export class RepCounter {
  private phase: Phase = "up";
  private reps = 0;
  private downThreshold: number;
  private upThreshold: number;

  constructor(downThreshold: number, upThreshold: number) {
    this.downThreshold = downThreshold;
    this.upThreshold = upThreshold;
  }

  /**
   * Feed the current angle. Returns the updated rep count.
   */
  update(angle: number): number {
    if (this.phase === "up" && angle < this.downThreshold) {
      this.phase = "down";
    } else if (this.phase === "down" && angle > this.upThreshold) {
      this.phase = "up";
      this.reps++;
    }
    return this.reps;
  }

  getReps(): number {
    return this.reps;
  }

  getPhase(): Phase {
    return this.phase;
  }

  reset(): void {
    this.reps = 0;
    this.phase = "up";
  }
}
