import type { GenerateWorkoutRequest, Workout } from "@aifitness/types";

export async function generateWorkout(
  request: GenerateWorkoutRequest
): Promise<Workout> {
  const res = await fetch("/api/generate-workout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate workout: ${res.statusText}`);
  }

  const data = await res.json();
  return data.workout;
}
