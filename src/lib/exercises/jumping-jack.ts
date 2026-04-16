import { ExerciseDefinition } from "@/types/exercise";
import { LANDMARKS } from "@/lib/pose/landmarks";

export const jumpingJackDefinition: ExerciseDefinition = {
  id: "jumping-jack",
  name: "Jumping Jacks",
  description: "Jump while spreading arms and legs, then return",
  icon: "\u2B50",
  targetAngles: [
    {
      name: "leftArm",
      pointA: LANDMARKS.LEFT_HIP,
      pointB: LANDMARKS.LEFT_SHOULDER,
      pointC: LANDMARKS.LEFT_ELBOW,
    },
    {
      name: "rightArm",
      pointA: LANDMARKS.RIGHT_HIP,
      pointB: LANDMARKS.RIGHT_SHOULDER,
      pointC: LANDMARKS.RIGHT_ELBOW,
    },
    {
      name: "leftLeg",
      pointA: LANDMARKS.LEFT_SHOULDER,
      pointB: LANDMARKS.LEFT_HIP,
      pointC: LANDMARKS.LEFT_KNEE,
    },
  ],
  repDetection: {
    primaryAngle: "leftArm",
    downThreshold: 50,
    upThreshold: 140,
  },
  formRules: [
    {
      name: "armExtension",
      description: "Fully extend arms",
      angleName: "leftArm",
      idealMin: 150,
      idealMax: 180,
      severity: "warning",
      correction: "Raise your arms higher, fully extend them",
    },
  ],
  defaultSets: 3,
  defaultReps: 15,
  restSeconds: 45,
};
