export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  instructions?: string;
  targetMuscles: string[];
  demoVideoUrl?: string;
  formRules?: FormRule[];
}

export interface FormRule {
  name: string;
  description: string;
  jointAngle: {
    joints: [string, string, string]; // three keypoint names
    minAngle: number;
    maxAngle: number;
  };
}

export interface Workout {
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number;
  exercises: Exercise[];
}

export interface UserProfile {
  id: string;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goal: string;
  equipment: string[];
  preferredDuration: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  exerciseResults: ExerciseResult[];
}

export interface ExerciseResult {
  exerciseName: string;
  completedSets: number;
  completedReps: number;
  formScore: number; // 0-100
}

export interface GenerateWorkoutRequest {
  fitnessLevel: string;
  goal: string;
  duration: number;
  equipment: string[];
}
