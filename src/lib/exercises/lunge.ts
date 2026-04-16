import { ExerciseDefinition } from "@/types/exercise";
import { LANDMARKS } from "@/lib/pose/landmarks";

export const lungeDefinition: ExerciseDefinition = {
  id: "lunge",
  name: "Lunges",
  description: "Step forward and lower your body, alternating legs",
  icon: "\u{1F9B5}",
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
      name: "torso",
      pointA: LANDMARKS.LEFT_SHOULDER,
      pointB: LANDMARKS.LEFT_HIP,
      pointC: LANDMARKS.LEFT_KNEE,
    },
  ],
  repDetection: {
    primaryAngle: "leftKnee",
    downThreshold: 100,
    upThreshold: 155,
  },
  formRules: [
    {
      name: "frontKneeAngle",
      description: "Front knee at 90 degrees",
      angleName: "leftKnee",
      idealMin: 80,
      idealMax: 105,
      severity: "warning",
      correction: "Bend your front knee to about 90 degrees",
    },
    {
      name: "torsoUpright",
      description: "Keep torso upright",
      angleName: "torso",
      idealMin: 70,
      idealMax: 110,
      severity: "error",
      correction: "Keep your upper body upright, don't lean forward",
    },
  ],
  defaultSets: 3,
  defaultReps: 8,
  restSeconds: 60,
};
