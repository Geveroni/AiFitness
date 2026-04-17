/**
 * MovementTracker: Records joint positions over time to analyze
 * movement quality beyond static angle checks.
 *
 * Tracks per rep:
 * - Joint positions each frame (path/trajectory)
 * - Min/max angles (range of motion)
 * - Phase timing (tempo)
 * - Left vs right comparison (symmetry)
 * - Lateral drift (e.g., knee cave)
 */

export interface JointPosition {
  x: number;
  y: number;
  z: number;
}

export interface FrameSnapshot {
  timestamp: number;
  joints: Record<string, JointPosition>;
  angles: Record<string, number>;
  phase: "up" | "down";
}

export interface RepAnalysis {
  repNumber: number;
  /** Time in ms for the full rep */
  duration: number;
  /** Time in ms for the down phase */
  downDuration: number;
  /** Time in ms for the up phase */
  upDuration: number;
  /** Min angle reached during down phase (deeper = smaller for squats) */
  minAngle: number;
  /** Max angle during up phase (full extension) */
  maxAngle: number;
  /** Range of motion = maxAngle - minAngle */
  rangeOfMotion: number;
  /** Lateral drift of key joints (e.g., knee X movement relative to ankle) */
  lateralDrift: LateralDrift[];
  /** Left vs right angle difference at key moment */
  symmetry: SymmetryCheck[];
  /** Tempo rating: "too_fast" | "good" | "too_slow" */
  tempo: "too_fast" | "good" | "too_slow";
  /** Overall movement quality score 0-100 */
  movementScore: number;
}

export interface LateralDrift {
  jointName: string;
  referenceJoint: string;
  /** How many pixels the joint drifted laterally relative to reference */
  maxDriftX: number;
  /** Direction of drift */
  direction: "inward" | "outward" | "stable";
  description: string;
}

export interface SymmetryCheck {
  leftAngle: number;
  rightAngle: number;
  difference: number;
  description: string;
}

/** Configuration for what to track per exercise */
export interface MovementConfig {
  /** Expected rep duration range in ms [min, max] */
  tempoRange: [number, number];
  /** Expected ROM range in degrees [min, max] */
  romRange: [number, number];
  /** Joints to check for lateral drift [joint, reference] */
  lateralChecks: { joint: string; reference: string; maxDrift: number; label: string }[];
  /** Angle pairs for symmetry [leftJoints, rightJoints] */
  symmetryChecks: {
    leftJoints: [string, string, string];
    rightJoints: [string, string, string];
    label: string;
  }[];
  /** Primary angle joints for ROM tracking */
  primaryAngleJoints: [string, string, string];
}

export const MOVEMENT_CONFIGS: Record<string, MovementConfig> = {
  "Bodyweight Squat": {
    tempoRange: [1500, 4000],
    romRange: [60, 100],
    lateralChecks: [
      { joint: "LEFT_KNEE", reference: "LEFT_ANKLE", maxDrift: 0.05, label: "Left knee caving in" },
      { joint: "RIGHT_KNEE", reference: "RIGHT_ANKLE", maxDrift: 0.05, label: "Right knee caving in" },
    ],
    symmetryChecks: [
      {
        leftJoints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
        rightJoints: ["RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"],
        label: "Knee bend symmetry",
      },
    ],
    primaryAngleJoints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
  },
  "Push-Up": {
    tempoRange: [1500, 4000],
    romRange: [50, 100],
    lateralChecks: [],
    symmetryChecks: [
      {
        leftJoints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
        rightJoints: ["RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"],
        label: "Arm bend symmetry",
      },
    ],
    primaryAngleJoints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
  },
  "Forward Lunge": {
    tempoRange: [2000, 5000],
    romRange: [50, 90],
    lateralChecks: [
      { joint: "LEFT_KNEE", reference: "LEFT_ANKLE", maxDrift: 0.06, label: "Front knee drifting" },
    ],
    symmetryChecks: [],
    primaryAngleJoints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
  },
  "Bicep Curl": {
    tempoRange: [1500, 4000],
    romRange: [80, 130],
    lateralChecks: [
      { joint: "LEFT_ELBOW", reference: "LEFT_HIP", maxDrift: 0.04, label: "Elbow drifting from body" },
    ],
    symmetryChecks: [
      {
        leftJoints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
        rightJoints: ["RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"],
        label: "Curl symmetry",
      },
    ],
    primaryAngleJoints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
  },
};

export class MovementTracker {
  private frames: FrameSnapshot[] = [];
  private repStartTime = 0;
  private phaseStartTime = 0;
  private currentPhase: "up" | "down" = "up";
  private minAngleInRep = 180;
  private maxAngleInRep = 0;
  private repCount = 0;
  private config: MovementConfig;
  private repHistory: RepAnalysis[] = [];
  private downDuration = 0;

  constructor(exerciseName: string) {
    this.config = MOVEMENT_CONFIGS[exerciseName] || MOVEMENT_CONFIGS["Bodyweight Squat"];
    this.repStartTime = performance.now();
    this.phaseStartTime = performance.now();
  }

  /** Record a frame of pose data */
  addFrame(
    joints: Record<string, JointPosition>,
    angles: Record<string, number>,
    phase: "up" | "down",
    primaryAngle: number
  ) {
    const now = performance.now();

    this.frames.push({ timestamp: now, joints, angles, phase });

    // Track min/max angle
    if (primaryAngle < this.minAngleInRep) this.minAngleInRep = primaryAngle;
    if (primaryAngle > this.maxAngleInRep) this.maxAngleInRep = primaryAngle;

    // Detect phase transition
    if (phase !== this.currentPhase) {
      if (this.currentPhase === "down" && phase === "up") {
        this.downDuration = now - this.phaseStartTime;
      }
      this.currentPhase = phase;
      this.phaseStartTime = now;
    }

    // Keep only last 300 frames (~10 seconds at 30fps)
    if (this.frames.length > 300) {
      this.frames = this.frames.slice(-300);
    }
  }

  /** Called when a rep is completed. Analyzes the rep and returns results. */
  completeRep(): RepAnalysis {
    const now = performance.now();
    this.repCount++;

    const duration = now - this.repStartTime;
    const upDuration = duration - this.downDuration;

    // Range of motion
    const rangeOfMotion = this.maxAngleInRep - this.minAngleInRep;

    // Tempo
    let tempo: "too_fast" | "good" | "too_slow" = "good";
    if (duration < this.config.tempoRange[0]) tempo = "too_fast";
    else if (duration > this.config.tempoRange[1]) tempo = "too_slow";

    // Lateral drift analysis (using frames from this rep)
    const lateralDrift = this.analyzeLateralDrift();

    // Symmetry analysis
    const symmetry = this.analyzeSymmetry();

    // Movement score
    const movementScore = this.calculateMovementScore(
      rangeOfMotion,
      tempo,
      lateralDrift,
      symmetry
    );

    const analysis: RepAnalysis = {
      repNumber: this.repCount,
      duration: Math.round(duration),
      downDuration: Math.round(this.downDuration),
      upDuration: Math.round(upDuration),
      minAngle: Math.round(this.minAngleInRep),
      maxAngle: Math.round(this.maxAngleInRep),
      rangeOfMotion: Math.round(rangeOfMotion),
      lateralDrift,
      symmetry,
      tempo,
      movementScore,
    };

    this.repHistory.push(analysis);

    // Reset for next rep
    this.repStartTime = now;
    this.minAngleInRep = 180;
    this.maxAngleInRep = 0;
    this.downDuration = 0;

    return analysis;
  }

  private analyzeLateralDrift(): LateralDrift[] {
    const results: LateralDrift[] = [];
    if (this.frames.length < 5) return results;

    for (const check of this.config.lateralChecks) {
      let maxDrift = 0;
      let driftDirection: "inward" | "outward" | "stable" = "stable";

      // Get reference position from first frame
      const firstFrame = this.frames[0];
      const refStart = firstFrame.joints[check.reference];
      const jointStart = firstFrame.joints[check.joint];

      if (!refStart || !jointStart) continue;

      const baselineOffset = jointStart.x - refStart.x;

      for (const frame of this.frames) {
        const ref = frame.joints[check.reference];
        const joint = frame.joints[check.joint];
        if (!ref || !joint) continue;

        const currentOffset = joint.x - ref.x;
        const drift = currentOffset - baselineOffset;

        if (Math.abs(drift) > Math.abs(maxDrift)) {
          maxDrift = drift;
        }
      }

      if (Math.abs(maxDrift) > check.maxDrift) {
        driftDirection = maxDrift > 0 ? "outward" : "inward";
      }

      results.push({
        jointName: check.joint,
        referenceJoint: check.reference,
        maxDriftX: Math.round(Math.abs(maxDrift) * 1000) / 1000,
        direction: driftDirection,
        description:
          driftDirection === "stable"
            ? `${check.label}: Good alignment`
            : `${check.label}`,
      });
    }

    return results;
  }

  private analyzeSymmetry(): SymmetryCheck[] {
    const results: SymmetryCheck[] = [];
    if (this.frames.length < 5) return results;

    // Use the frame with the lowest primary angle (bottom of rep)
    const bottomFrame = this.frames.reduce((best, frame) => {
      const key = this.config.primaryAngleJoints.join("-");
      const angle = frame.angles[key] ?? 180;
      const bestAngle = best.angles[key] ?? 180;
      return angle < bestAngle ? frame : best;
    }, this.frames[0]);

    for (const check of this.config.symmetryChecks) {
      const leftKey = check.leftJoints.join("-");
      const rightKey = check.rightJoints.join("-");

      const leftAngle = bottomFrame.angles[leftKey];
      const rightAngle = bottomFrame.angles[rightKey];

      if (leftAngle === undefined || rightAngle === undefined) continue;

      const difference = Math.abs(leftAngle - rightAngle);

      results.push({
        leftAngle: Math.round(leftAngle),
        rightAngle: Math.round(rightAngle),
        difference: Math.round(difference),
        description:
          difference > 15
            ? `${check.label}: Significant imbalance (${Math.round(difference)}° difference)`
            : difference > 8
              ? `${check.label}: Slight imbalance (${Math.round(difference)}°)`
              : `${check.label}: Good symmetry`,
      });
    }

    return results;
  }

  private calculateMovementScore(
    rom: number,
    tempo: string,
    drift: LateralDrift[],
    symmetry: SymmetryCheck[]
  ): number {
    let score = 100;

    // ROM scoring (25 points)
    const [minRom, maxRom] = this.config.romRange;
    if (rom < minRom) score -= Math.min(25, (minRom - rom) * 1.5);
    else if (rom > maxRom) score -= 5; // slightly over is fine

    // Tempo scoring (20 points)
    if (tempo === "too_fast") score -= 15;
    else if (tempo === "too_slow") score -= 10;

    // Lateral drift scoring (30 points)
    for (const d of drift) {
      if (d.direction !== "stable") score -= 15;
    }

    // Symmetry scoring (25 points)
    for (const s of symmetry) {
      if (s.difference > 15) score -= 20;
      else if (s.difference > 8) score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  /** Get summary of all reps for AI analysis */
  getRepHistory(): RepAnalysis[] {
    return [...this.repHistory];
  }

  /** Get average movement score across all reps */
  getAverageScore(): number {
    if (this.repHistory.length === 0) return 100;
    const sum = this.repHistory.reduce((s, r) => s + r.movementScore, 0);
    return Math.round(sum / this.repHistory.length);
  }

  /** Generate a text summary for AI interpretation */
  getSummaryForAI(): string {
    if (this.repHistory.length === 0) return "No reps completed yet.";

    const lines: string[] = [];

    for (const rep of this.repHistory) {
      const issues: string[] = [];
      if (rep.tempo !== "good") issues.push(`tempo: ${rep.tempo} (${rep.duration}ms)`);
      if (rep.rangeOfMotion < this.config.romRange[0])
        issues.push(`limited ROM: ${rep.rangeOfMotion}° (need ${this.config.romRange[0]}°+)`);
      for (const d of rep.lateralDrift) {
        if (d.direction !== "stable") issues.push(d.description);
      }
      for (const s of rep.symmetry) {
        if (s.difference > 8) issues.push(s.description);
      }

      const issueStr = issues.length > 0 ? issues.join("; ") : "good form";
      lines.push(
        `Rep ${rep.repNumber}: score=${rep.movementScore}, ROM=${rep.rangeOfMotion}°, ` +
        `down=${rep.downDuration}ms, up=${rep.upDuration}ms — ${issueStr}`
      );
    }

    return lines.join("\n");
  }

  reset() {
    this.frames = [];
    this.repHistory = [];
    this.repCount = 0;
    this.repStartTime = performance.now();
    this.phaseStartTime = performance.now();
    this.currentPhase = "up";
    this.minAngleInRep = 180;
    this.maxAngleInRep = 0;
    this.downDuration = 0;
  }
}
