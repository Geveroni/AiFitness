import type { Exercise } from "@aifitness/types";

/**
 * Built-in exercise library for MVP.
 * Form rules reference MediaPipe Pose Landmarker keypoint names.
 */
export const EXERCISE_LIBRARY: Record<string, Omit<Exercise, "sets" | "reps" | "restSeconds">> = {
  squat: {
    name: "Bodyweight Squat",
    targetMuscles: ["quadriceps", "glutes", "hamstrings"],
    instructions: "Stand with feet shoulder-width apart. Lower your hips back and down, keeping chest up and knees tracking over toes. Go as deep as comfortable, then drive through heels to stand.",
    formRules: [
      {
        name: "knee_angle",
        description: "Bend knees deeper — aim for 90 degrees at the bottom",
        jointAngle: {
          joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
          minAngle: 70,
          maxAngle: 120,
        },
      },
      {
        name: "back_angle",
        description: "Keep your back more upright — chest up",
        jointAngle: {
          joints: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"],
          minAngle: 40,
          maxAngle: 90,
        },
      },
    ],
  },

  pushup: {
    name: "Push-Up",
    targetMuscles: ["chest", "triceps", "shoulders"],
    instructions: "Start in plank position with hands shoulder-width apart. Lower chest to the ground by bending elbows, then push back up. Keep body in a straight line throughout.",
    formRules: [
      {
        name: "elbow_angle",
        description: "Lower your chest more — bend elbows to 90 degrees",
        jointAngle: {
          joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
          minAngle: 70,
          maxAngle: 110,
        },
      },
    ],
  },

  lunge: {
    name: "Forward Lunge",
    targetMuscles: ["quadriceps", "glutes", "hamstrings"],
    instructions: "Step forward with one leg. Lower your hips until both knees are bent at about 90 degrees. Push back to standing and alternate legs.",
    formRules: [
      {
        name: "front_knee_angle",
        description: "Bend your front knee to 90 degrees",
        jointAngle: {
          joints: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"],
          minAngle: 80,
          maxAngle: 100,
        },
      },
    ],
  },

  plank: {
    name: "Plank",
    targetMuscles: ["core", "shoulders", "glutes"],
    instructions: "Hold a push-up position with arms straight. Keep your body in a straight line from head to heels. Engage your core and hold.",
    formRules: [
      {
        name: "body_line",
        description: "Keep your hips in line — don't sag or pike",
        jointAngle: {
          joints: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_ANKLE"],
          minAngle: 160,
          maxAngle: 180,
        },
      },
    ],
  },

  bicep_curl: {
    name: "Bicep Curl",
    targetMuscles: ["biceps", "forearms"],
    instructions: "Stand holding dumbbells at your sides. Curl the weights up toward your shoulders, keeping elbows close to your body. Slowly lower back down.",
    formRules: [
      {
        name: "elbow_position",
        description: "Keep your elbows pinned to your sides",
        jointAngle: {
          joints: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"],
          minAngle: 30,
          maxAngle: 160,
        },
      },
    ],
  },
};
