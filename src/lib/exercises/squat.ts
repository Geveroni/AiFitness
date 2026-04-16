import { ExerciseDefinition } from "@/types/exercise";
import { LANDMARKS } from "@/lib/pose/landmarks";

export const squatDefinition: ExerciseDefinition = {
  id: "squat",
  name: "Squats",
  description: "Lower your body by bending knees, keeping back straight",
  icon: "\u{1F3CB}\uFE0F",
  targetAngles: [
    {
      name: "leftKnee",
      pointA: LANDMARKS.LEFT_HIP,
      pointB: LANDMARKS.LEFT_KNEE,
      pointC: LANDMARKS.LEFT_ANKLE,
    },
    {
      name: "rightKnee",
      pointA: LANDMARKS.RIGHT_HIP,
      pointB: LANDMARKS.RIGHT_KNEE,
      pointC: LANDMARKS.RIGHT_ANKLE,
    },
    {
      name: "leftHip",
      pointA: LANDMARKS.LEFT_SHOULDER,
      pointB: LANDMARKS.LEFT_HIP,
      pointC: LANDMARKS.LEFT_KNEE,
    },
    {
      name: "rightHip",
      pointA: LANDMARKS.RIGHT_SHOULDER,
      pointB: LANDMARKS.RIGHT_HIP,
      pointC: LANDMARKS.RIGHT_KNEE,
    },
  ],
  repDetection: {
    primaryAngle: "leftKnee",
    downThreshold: 100,
    upThreshold: 155,
  },
  formRules: [
    {
      name: "kneeDepth",
      description: "Go deep enough",
      angleName: "leftKnee",
      idealMin: 70,
      idealMax: 105,
      severity: "warning",
      correction: "Try to go a bit deeper in your squat",
    },
    {
      name: "backStraight",
      description: "Keep your back straight",
      angleName: "leftHip",
      idealMin: 50,
      idealMax: 110,
      severity: "error",
      correction: "Keep your chest up and back straight",
    },
  ],
  defaultSets: 3,
  defaultReps: 10,
  restSeconds: 60,
};
