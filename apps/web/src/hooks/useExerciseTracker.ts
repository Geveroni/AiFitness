"use client";

import { useRef, useState, useCallback } from "react";
import {
  calculateJointAngle,
  RepCounter,
  scoreForm,
  MovementTracker,
} from "@aifitness/workout-engine";
import type { FormRule } from "@aifitness/types";
import type { RepAnalysis } from "@aifitness/workout-engine";
import type { PoseLandmarks } from "./usePoseDetection";

/** MediaPipe Pose Landmarker keypoint indices */
const LANDMARKS: Record<string, number> = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

function getLandmarkIndex(name: string): number | undefined {
  return LANDMARKS[name];
}

interface ExerciseConfig {
  name: string;
  formRules: FormRule[];
  repCounting: {
    joints: [string, string, string];
    downThreshold: number;
    upThreshold: number;
  };
}

export const EXERCISE_CONFIGS: Record<string, ExerciseConfig> = {
  "Bodyweight Squat": {
    name: "Bodyweight Squat",
    formRules: [
      {
        name: "knee_angle",
        description: "Bend knees deeper",
        jointAngle: { joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], minAngle: 70, maxAngle: 120 },
      },
      {
        name: "back_angle",
        description: "Keep your back upright",
        jointAngle: { joints: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], minAngle: 40, maxAngle: 90 },
      },
    ],
    repCounting: { joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], downThreshold: 110, upThreshold: 150 },
  },
  "Push-Up": {
    name: "Push-Up",
    formRules: [
      {
        name: "elbow_angle",
        description: "Lower your chest more",
        jointAngle: { joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], minAngle: 70, maxAngle: 110 },
      },
    ],
    repCounting: { joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], downThreshold: 100, upThreshold: 150 },
  },
  "Forward Lunge": {
    name: "Forward Lunge",
    formRules: [
      {
        name: "front_knee",
        description: "Bend your front knee to 90 degrees",
        jointAngle: { joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], minAngle: 80, maxAngle: 100 },
      },
    ],
    repCounting: { joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], downThreshold: 110, upThreshold: 150 },
  },
  "Bicep Curl": {
    name: "Bicep Curl",
    formRules: [
      {
        name: "elbow_position",
        description: "Keep elbows at your sides",
        jointAngle: { joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], minAngle: 30, maxAngle: 160 },
      },
    ],
    repCounting: { joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], downThreshold: 80, upThreshold: 140 },
  },
};

export interface TrackerState {
  reps: number;
  formScore: number;
  violations: string[];
  currentAngle: number;
  phase: "up" | "down";
  /** Movement quality score (0-100) from MovementTracker */
  movementScore: number;
  /** Latest rep analysis */
  lastRepAnalysis: RepAnalysis | null;
  /** AI coaching feedback */
  aiCoachingTip: string;
}

export function useExerciseTracker(exerciseName: string) {
  const [state, setState] = useState<TrackerState>({
    reps: 0,
    formScore: 100,
    violations: [],
    currentAngle: 0,
    phase: "up",
    movementScore: 100,
    lastRepAnalysis: null,
    aiCoachingTip: "",
  });

  const repCounterRef = useRef<RepCounter | null>(null);
  const movementTrackerRef = useRef<MovementTracker | null>(null);
  const config = EXERCISE_CONFIGS[exerciseName];
  const frameCountRef = useRef(0);
  const prevRepsRef = useRef(0);
  const aiRequestPendingRef = useRef(false);

  // Initialize on first call
  if (!repCounterRef.current && config) {
    repCounterRef.current = new RepCounter(
      config.repCounting.downThreshold,
      config.repCounting.upThreshold
    );
    movementTrackerRef.current = new MovementTracker(exerciseName);
  }

  /** Get all relevant joint positions from landmarks */
  function extractJoints(landmarks: PoseLandmarks): Record<string, { x: number; y: number; z: number }> {
    const joints: Record<string, { x: number; y: number; z: number }> = {};
    for (const [name, idx] of Object.entries(LANDMARKS)) {
      const lm = landmarks[idx];
      if (lm) joints[name] = { x: lm.x, y: lm.y, z: lm.z || 0 };
    }
    return joints;
  }

  /** Calculate all relevant angles */
  function calculateAllAngles(landmarks: PoseLandmarks): Map<string, number> {
    const angles = new Map<string, number>();

    // All joint triplets we care about
    const triplets = [
      ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
      ["RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"],
      ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"],
      ["RIGHT_SHOULDER", "RIGHT_HIP", "RIGHT_KNEE"],
      ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
      ["RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"],
      ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_ANKLE"],
    ];

    for (const [j1, j2, j3] of triplets) {
      const i1 = getLandmarkIndex(j1);
      const i2 = getLandmarkIndex(j2);
      const i3 = getLandmarkIndex(j3);
      if (i1 === undefined || i2 === undefined || i3 === undefined) continue;

      const a = landmarks[i1];
      const b = landmarks[i2];
      const c = landmarks[i3];
      if (!a || !b || !c) continue;

      const angle = calculateJointAngle(a, b, c);
      angles.set(`${j1}-${j2}-${j3}`, angle);
    }

    return angles;
  }

  /** Request AI coaching feedback */
  async function requestAICoaching(movTracker: MovementTracker, issues: string[]) {
    if (aiRequestPendingRef.current) return;
    aiRequestPendingRef.current = true;

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName,
          repSummary: movTracker.getSummaryForAI(),
          currentIssues: issues,
        }),
      });
      const data = await res.json();
      setState((prev) => ({ ...prev, aiCoachingTip: data.feedback }));
    } catch {
      // Silently fail — AI coaching is optional
    } finally {
      aiRequestPendingRef.current = false;
    }
  }

  const processFrame = useCallback(
    (landmarks: PoseLandmarks): TrackerState | null => {
      if (!config || !repCounterRef.current || !movementTrackerRef.current) return null;

      frameCountRef.current++;

      // Primary angle for rep counting
      const [j1, j2, j3] = config.repCounting.joints;
      const i1 = getLandmarkIndex(j1)!;
      const i2 = getLandmarkIndex(j2)!;
      const i3 = getLandmarkIndex(j3)!;

      const a = landmarks[i1];
      const b = landmarks[i2];
      const c = landmarks[i3];
      if (!a || !b || !c) return null;

      const primaryAngle = calculateJointAngle(a, b, c);
      const reps = repCounterRef.current.update(primaryAngle);
      const phase = repCounterRef.current.getPhase();

      // Feed movement tracker
      const joints = extractJoints(landmarks);
      const allAngles = calculateAllAngles(landmarks);
      const anglesObj: Record<string, number> = {};
      allAngles.forEach((v, k) => { anglesObj[k] = v; });

      movementTrackerRef.current.addFrame(joints, anglesObj, phase, primaryAngle);

      // Form score (every 5th frame)
      let formScore = state.formScore;
      let violations: string[] = state.violations;

      if (frameCountRef.current % 5 === 0) {
        const result = scoreForm(config.formRules, allAngles);
        formScore = result.score;
        violations = result.violations;
      }

      // Rep completed — run movement analysis
      let lastRepAnalysis = state.lastRepAnalysis;
      let movementScore = state.movementScore;

      if (reps > prevRepsRef.current) {
        prevRepsRef.current = reps;
        const repAnalysis = movementTrackerRef.current.completeRep();
        lastRepAnalysis = repAnalysis;
        movementScore = movementTrackerRef.current.getAverageScore();

        // Collect all issues for AI
        const issues: string[] = [...violations];
        if (repAnalysis.tempo !== "good") issues.push(repAnalysis.tempo);
        if (repAnalysis.rangeOfMotion < 60) issues.push("limited ROM");
        for (const d of repAnalysis.lateralDrift) {
          if (d.direction !== "stable") issues.push(d.description);
        }
        for (const s of repAnalysis.symmetry) {
          if (s.difference > 8) issues.push(s.description);
        }

        // Request AI coaching every 3rd rep (or on first rep)
        if (reps === 1 || reps % 3 === 0) {
          requestAICoaching(movementTrackerRef.current, issues);
        }
      }

      const newState: TrackerState = {
        reps,
        formScore,
        violations,
        currentAngle: Math.round(primaryAngle),
        phase,
        movementScore,
        lastRepAnalysis,
        aiCoachingTip: state.aiCoachingTip,
      };

      setState(newState);
      return newState;
    },
    [config, state.formScore, state.violations, state.lastRepAnalysis, state.movementScore, state.aiCoachingTip, exerciseName]
  );

  const reset = useCallback(() => {
    repCounterRef.current?.reset();
    movementTrackerRef.current?.reset();
    frameCountRef.current = 0;
    prevRepsRef.current = 0;
    setState({
      reps: 0,
      formScore: 100,
      violations: [],
      currentAngle: 0,
      phase: "up",
      movementScore: 100,
      lastRepAnalysis: null,
      aiCoachingTip: "",
    });
  }, []);

  return { state, processFrame, reset, isSupported: !!config };
}
