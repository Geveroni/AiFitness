import { NextRequest, NextResponse } from "next/server";
import type { GenerateWorkoutRequest, Workout } from "@aifitness/types";

/**
 * POST /api/generate-workout
 *
 * For MVP, this returns a mock workout.
 * Phase 2: Replace with Claude API call via Supabase Edge Function.
 */
export async function POST(req: NextRequest) {
  const body: GenerateWorkoutRequest = await req.json();

  // TODO: Replace with Claude API integration
  // For now, return a realistic mock workout
  const workout = generateMockWorkout(body);

  return NextResponse.json({ workout });
}

function generateMockWorkout(params: GenerateWorkoutRequest): Workout {
  const exercises = [];
  const isBodyweight = params.equipment.includes("bodyweight");
  const hasDumbbells = params.equipment.includes("dumbbells");

  // Select exercises based on equipment and duration
  const exercisePool = [
    {
      name: "Bodyweight Squat",
      sets: 3,
      reps: 12,
      restSeconds: 45,
      targetMuscles: ["quadriceps", "glutes"],
      instructions:
        "Stand with feet shoulder-width apart. Lower hips back and down, keep chest up.",
      available: isBodyweight,
    },
    {
      name: "Push-Up",
      sets: 3,
      reps: 10,
      restSeconds: 45,
      targetMuscles: ["chest", "triceps", "shoulders"],
      instructions:
        "Plank position, lower chest to ground, push back up. Keep body straight.",
      available: isBodyweight,
    },
    {
      name: "Forward Lunge",
      sets: 3,
      reps: 10,
      restSeconds: 45,
      targetMuscles: ["quadriceps", "glutes", "hamstrings"],
      instructions:
        "Step forward, lower until both knees at 90 degrees. Alternate legs.",
      available: isBodyweight,
    },
    {
      name: "Plank",
      sets: 3,
      reps: 30,
      restSeconds: 30,
      targetMuscles: ["core", "shoulders"],
      instructions:
        "Hold push-up position with arms straight. Keep body in a line. Reps = seconds.",
      available: isBodyweight,
    },
    {
      name: "Dumbbell Bicep Curl",
      sets: 3,
      reps: 12,
      restSeconds: 45,
      targetMuscles: ["biceps"],
      instructions:
        "Curl weights toward shoulders, keep elbows at sides. Lower slowly.",
      available: hasDumbbells,
    },
    {
      name: "Dumbbell Shoulder Press",
      sets: 3,
      reps: 10,
      restSeconds: 60,
      targetMuscles: ["shoulders", "triceps"],
      instructions:
        "Press dumbbells overhead from shoulder height. Lower with control.",
      available: hasDumbbells,
    },
  ];

  const available = exercisePool.filter((e) => e.available);
  const count = Math.min(
    available.length,
    Math.max(3, Math.floor(params.duration / 5))
  );
  const selected = available.slice(0, count);

  for (const ex of selected) {
    const { available: _, ...exercise } = ex;
    // Adjust for fitness level
    if (params.fitnessLevel === "beginner") {
      exercise.sets = Math.max(2, exercise.sets - 1);
      exercise.reps = Math.max(6, exercise.reps - 2);
    } else if (params.fitnessLevel === "advanced") {
      exercise.sets += 1;
      exercise.reps += 4;
    }
    exercises.push(exercise);
  }

  return {
    name: `${params.duration}-Min ${capitalize(params.goal.replace("_", " "))} Workout`,
    description: `A ${params.fitnessLevel}-level ${params.goal.replace("_", " ")} workout using ${params.equipment.join(", ")}`,
    difficulty: params.fitnessLevel as Workout["difficulty"],
    estimatedDuration: params.duration,
    exercises,
  };
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
