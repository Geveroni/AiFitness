"use client";

import { useState } from "react";
import styles from "./workout.module.css";
import type { Workout, Exercise } from "@aifitness/types";

type WorkoutState = "setup" | "generating" | "ready" | "active" | "complete";

export default function WorkoutPage() {
  const [state, setState] = useState<WorkoutState>("setup");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  async function generateWorkout() {
    setState("generating");
    try {
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fitnessLevel: "beginner",
          goal: "general_fitness",
          duration: 20,
          equipment: ["bodyweight"],
        }),
      });
      const data = await res.json();
      setWorkout(data.workout);
      setState("ready");
    } catch {
      setState("setup");
    }
  }

  function startWorkout() {
    setState("active");
    setCurrentExerciseIndex(0);
  }

  function nextExercise() {
    if (!workout) return;
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
    } else {
      setState("complete");
    }
  }

  const currentExercise = workout?.exercises[currentExerciseIndex];

  return (
    <main className={styles.main}>
      {state === "setup" && (
        <div className={styles.setup}>
          <h1>Create Your Workout</h1>
          <p className={styles.description}>
            AI will generate a personalized workout based on your profile
          </p>
          <button className={styles.primaryBtn} onClick={generateWorkout}>
            Generate Workout
          </button>
        </div>
      )}

      {state === "generating" && (
        <div className={styles.setup}>
          <div className={styles.spinner} />
          <h2>Generating your workout...</h2>
          <p className={styles.description}>
            AI is crafting a plan tailored for you
          </p>
        </div>
      )}

      {state === "ready" && workout && (
        <div className={styles.ready}>
          <h1>{workout.name}</h1>
          <p className={styles.description}>{workout.description}</p>
          <div className={styles.stats}>
            <span>{workout.exercises.length} exercises</span>
            <span>{workout.estimatedDuration} min</span>
            <span>{workout.difficulty}</span>
          </div>
          <div className={styles.exerciseList}>
            {workout.exercises.map((ex, i) => (
              <div key={i} className={styles.exerciseItem}>
                <span className={styles.exerciseNum}>{i + 1}</span>
                <div>
                  <strong>{ex.name}</strong>
                  <p>
                    {ex.sets} sets x {ex.reps} reps
                    {ex.restSeconds ? ` | ${ex.restSeconds}s rest` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className={styles.primaryBtn} onClick={startWorkout}>
            Start Workout
          </button>
        </div>
      )}

      {state === "active" && currentExercise && (
        <div className={styles.active}>
          <div className={styles.progress}>
            Exercise {currentExerciseIndex + 1} of{" "}
            {workout!.exercises.length}
          </div>

          <div className={styles.exerciseDisplay}>
            {/* Avatar panel will go here */}
            <div className={styles.avatarPlaceholder}>
              <p>Avatar Coach</p>
              <small>Simli integration (Phase 2)</small>
            </div>

            <div className={styles.exerciseInfo}>
              <h1>{currentExercise.name}</h1>
              <div className={styles.setInfo}>
                {currentExercise.sets} sets x {currentExercise.reps} reps
              </div>
              {currentExercise.instructions && (
                <p className={styles.instructions}>
                  {currentExercise.instructions}
                </p>
              )}
            </div>

            {/* Camera feed will go here */}
            <div className={styles.cameraPlaceholder}>
              <p>Camera Feed</p>
              <small>Pose estimation (Phase 3)</small>
            </div>
          </div>

          <button className={styles.primaryBtn} onClick={nextExercise}>
            {currentExerciseIndex < workout!.exercises.length - 1
              ? "Next Exercise"
              : "Finish Workout"}
          </button>
        </div>
      )}

      {state === "complete" && (
        <div className={styles.setup}>
          <h1>Workout Complete!</h1>
          <p className={styles.description}>Great job finishing your session</p>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              setState("setup");
              setWorkout(null);
            }}
          >
            New Workout
          </button>
        </div>
      )}
    </main>
  );
}
