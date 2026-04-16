import { ExerciseDefinition } from "@/types/exercise";
import { LANDMARKS } from "@/lib/pose/landmarks";

export const pushupDefinition: ExerciseDefinition = {
  id: "pushup",
  name: "Push-ups",
  description: "Lower your body with arms, keeping body in a straight line",
  icon: "\u{1F4AA}",
  targetAngles: [
    {
      name: "leftElbow",
      pointA: LANDMARKS.LEFT_SHOULDER,
      pointB: LANDMARKS.LEFT_ELBOW,
      pointC: LANDMARKS.LEFT_WRIST,
    },
    {
      name: "rightElbow",
      pointA: LANDMARKS.RIGHT_SHOULDER,
      pointB: LANDMARKS.RIGHT_ELBOW,
      pointC: LANDMARKS.RIGHT_WRIST,
    },
    {
      name: "bodyAlignment",
      pointA: LANDMARKS.LEFT_SHOULDER,
      pointB: LANDMARKS.LEFT_HIP,
      pointC: LANDMARKS.LEFT_ANKLE,
    },
  ],
  repDetection: {
    primaryAngle: "leftElbow",
    downThreshold: 100,
    upThreshold: 155,
  },
  formRules: [
    {
      name: "elbowDepth",
      description: "Lower enough",
      angleName: "leftElbow",
      idealMin: 70,
      idealMax: 105,
      severity: "warning",
      correction: "Try to go lower, bend your elbows more",
    },
    {
      name: "bodyLine",
      description: "Keep body straight",
      angleName: "bodyAlignment",
      idealMin: 155,
      idealMax: 180,
      severity: "error",
      correction: "Keep your hips in line, don't sag or pike",
    },
  ],
  defaultSets: 3,
  defaultReps: 10,
  restSeconds: 60,
};
