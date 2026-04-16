import { ExerciseId, RepPhase, FormRule } from "./exercise";

export type WorkoutPhase =
  | "idle"
  | "countdown"
  | "exercise"
  | "rest"
  | "complete";

export type AvatarState = "idle" | "talking" | "encouraging" | "correcting";

export interface WorkoutState {
  phase: WorkoutPhase;
  currentExercise: ExerciseId | null;
  currentSet: number;
  currentRep: number;
  targetSets: number;
  targetReps: number;
  formScore: number;
  repPhase: RepPhase;
  timerSeconds: number;
  totalRepsCompleted: number;
  corrections: string[];
  avatarState: AvatarState;
  currentMessage: string;
  workoutLog: WorkoutLogEntry[];
  elapsedSeconds: number;
}

export interface WorkoutLogEntry {
  exercise: ExerciseId;
  set: number;
  reps: number;
  avgFormScore: number;
  duration: number;
  timestamp: number;
}

export type WorkoutAction =
  | { type: "START_WORKOUT"; exercise: ExerciseId; sets: number; reps: number }
  | { type: "START_COUNTDOWN"; seconds: number }
  | { type: "START_SET" }
  | { type: "COUNT_REP" }
  | { type: "COMPLETE_SET"; avgFormScore: number; duration: number }
  | { type: "START_REST"; seconds: number }
  | { type: "END_REST" }
  | { type: "UPDATE_FORM_SCORE"; score: number }
  | { type: "ADD_CORRECTION"; correction: string }
  | { type: "UPDATE_REP_PHASE"; phase: RepPhase }
  | { type: "SET_AVATAR_STATE"; state: AvatarState }
  | { type: "SET_MESSAGE"; message: string }
  | { type: "TICK_TIMER" }
  | { type: "TICK_ELAPSED" }
  | { type: "COMPLETE_WORKOUT" }
  | { type: "RESET" };
