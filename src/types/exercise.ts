export type ExerciseId = "squat" | "pushup" | "lunge" | "jumping-jack";

export interface AngleDefinition {
  name: string;
  pointA: number;
  pointB: number;
  pointC: number;
}

export type RepPhase = "up" | "going-down" | "down" | "going-up";

export interface FormRule {
  name: string;
  description: string;
  angleName: string;
  idealMin: number;
  idealMax: number;
  severity: "warning" | "error";
  correction: string;
}

export interface ExerciseDefinition {
  id: ExerciseId;
  name: string;
  description: string;
  icon: string;
  targetAngles: AngleDefinition[];
  repDetection: {
    primaryAngle: string;
    downThreshold: number;
    upThreshold: number;
  };
  formRules: FormRule[];
  defaultSets: number;
  defaultReps: number;
  restSeconds: number;
}
