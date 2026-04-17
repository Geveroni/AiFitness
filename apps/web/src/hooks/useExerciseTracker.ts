"use client";

import { useRef, useState, useCallback } from "react";
import { calculateJointAngle, RepCounter, scoreForm } from "@aifitness/workout-engine";
import type { FormRule } from "@aifitness/types";
import type { PoseLandmarks } from "./usePoseDetection";

/** MediaPipe Pose Landmarker keypoint indices */
const LANDMARKS = {
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
} as const;

/** Map landmark name to index */
function getLandmarkIndex(name: string): number | undefined {
  return LANDMARKS[name as keyof typeof LANDMARKS];
}

interface ExerciseConfig {
  name: string;
  formRules: FormRule[];
  /** Thresholds for rep counting (primary angle) */
  repCounting: {
    joints: [string, string, string];
    downThreshold: number;
    upThreshold: number;
  };
}

/** Pre-configured exercise tracking configs */
export const EXERCISE_CONFIGS: Record<string, ExerciseConfig> = {
  "Bodyweight Squat": {
    name: "Bodyweight Squat",
    formRules: [
      {
        name: "knee_angle",
        description: "Bend knees deeper",
        jointAngle: {
          joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
          minAngle: 70,
          maxAngle: 120,
        },
      },
      {
        name: "back_angle",
        description: "Keep your back upright",
        jointAngle: {
          joints: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"],
          minAngle: 40,
          maxAngle: 90,
        },
      },
    ],
    repCounting: {
      joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
      downThreshold: 110,
      upThreshold: 150,
    },
  },
  "Push-Up": {
    name: "Push-Up",
    formRules: [
      {
        name: "elbow_angle",
        description: "Lower your chest more",
        jointAngle: {
          joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
          minAngle: 70,
          maxAngle: 110,
        },
      },
    ],
    repCounting: {
      joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
      downThreshold: 100,
      upThreshold: 150,
    },
  },
  "Forward Lunge": {
    name: "Forward Lunge",
    formRules: [
      {
        name: "front_knee",
        description: "Bend your front knee to 90 degrees",
        jointAngle: {
          joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
          minAngle: 80,
          maxAngle: 100,
        },
      },
    ],
    repCounting: {
      joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
      downThreshold: 110,
      upThreshold: 150,
    },
  },
  "Bicep Curl": {
    name: "Bicep Curl",
    formRules: [
      {
        name: "elbow_position",
        description: "Keep elbows at your sides",
        jointAngle: {
          joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
          minAngle: 30,
          maxAngle: 160,
        },
      },
    ],
    repCounting: {
      joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
      downThreshold: 80,
      upThreshold: 140,
    },
  },
};

export interface TrackerState {
  reps: number;
  formScore: number;
  violations: string[];
  currentAngle: number;
  phase: "up" | "down";
}

export function useExerciseTracker(exerciseName: string) {
  const [state, setState] = useState<TrackerState>({
    reps: 0,
    formScore: 100,
    violations: [],
    currentAngle: 0,
    phase: "up",
  });

  const repCounterRef = useRef<RepCounter | null>(null);
  const config = EXERCISE_CONFIGS[exerciseName];
  const frameCountRef = useRef(0);

  // Initialize rep counter when exercise changes
  const initCounter = useCallback(() => {
    if (!config) return;
    repCounterRef.current = new RepCounter(
      config.repCounting.downThreshold,
      config.repCounting.upThreshold
    );
  }, [config]);

  // Call once on setup
  if (!repCounterRef.current && config) {
    initCounter();
  }

  /**
   * Process a frame of pose landmarks.
   * Returns the current tracker state with updated reps, form score, etc.
   */
  const processFrame = useCallback(
    (landmarks: PoseLandmarks): TrackerState | null => {
      if (!config || !repCounterRef.current) return null;

      frameCountRef.current++;

      // Calculate the primary angle for rep counting
      const [j1, j2, j3] = config.repCounting.joints;
      const i1 = getLandmarkIndex(j1);
      const i2 = getLandmarkIndex(j2);
      const i3 = getLandmarkIndex(j3);

      if (i1 === undefined || i2 === undefined || i3 === undefined) return null;

      const a = landmarks[i1];
      const b = landmarks[i2];
      const c = landmarks[i3];

      if (!a || !b || !c) return null;

      const primaryAngle = calculateJointAngle(a, b, c);
      const reps = repCounterRef.current.update(primaryAngle);
      const phase = repCounterRef.current.getPhase();

      // Calculate form score (every 5th frame to reduce CPU)
      let formScore = state.formScore;
      let violations: string[] = state.violations;

      if (frameCountRef.current % 5 === 0) {
        const angles = new Map<string, number>();

        for (const rule of config.formRules) {
          const [rj1, rj2, rj3] = rule.jointAngle.joints;
          const ri1 = getLandmarkIndex(rj1);
          const ri2 = getLandmarkIndex(rj2);
          const ri3 = getLandmarkIndex(rj3);

          if (ri1 === undefined || ri2 === undefined || ri3 === undefined)
            continue;

          const ra = landmarks[ri1];
          const rb = landmarks[ri2];
          const rc = landmarks[ri3];

          if (!ra || !rb || !rc) continue;

          const angle = calculateJointAngle(ra, rb, rc);
          const key = rule.jointAngle.joints.join("-");
          angles.set(key, angle);
        }

        const result = scoreForm(config.formRules, angles);
        formScore = result.score;
        violations = result.violations;
      }

      const newState: TrackerState = {
        reps,
        formScore,
        violations,
        currentAngle: Math.round(primaryAngle),
        phase,
      };

      setState(newState);
      return newState;
    },
    [config, state.formScore, state.violations]
  );

  const reset = useCallback(() => {
    repCounterRef.current?.reset();
    frameCountRef.current = 0;
    setState({
      reps: 0,
      formScore: 100,
      violations: [],
      currentAngle: 0,
      phase: "up",
    });
  }, []);

  return {
    state,
    processFrame,
    reset,
    isSupported: !!config,
  };
}
