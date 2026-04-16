import { ExerciseDefinition, ExerciseId } from "@/types/exercise";
import { squatDefinition } from "./squat";
import { pushupDefinition } from "./pushup";
import { lungeDefinition } from "./lunge";
import { jumpingJackDefinition } from "./jumping-jack";

export const exerciseRegistry = new Map<ExerciseId, ExerciseDefinition>([
  ["squat", squatDefinition],
  ["pushup", pushupDefinition],
  ["lunge", lungeDefinition],
  ["jumping-jack", jumpingJackDefinition],
]);

export const exerciseList: ExerciseDefinition[] = [
  squatDefinition,
  pushupDefinition,
  lungeDefinition,
  jumpingJackDefinition,
];

export function getExercise(id: ExerciseId): ExerciseDefinition {
  const exercise = exerciseRegistry.get(id);
  if (!exercise) throw new Error(`Exercise ${id} not found`);
  return exercise;
}
