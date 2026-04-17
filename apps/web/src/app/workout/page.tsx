"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./workout.module.css";
import { PoseCamera } from "../../components/PoseCamera";
import { ExerciseHUD } from "../../components/ExerciseHUD";
import {
  useExerciseTracker,
  EXERCISE_CONFIGS,
} from "../../hooks/useExerciseTracker";
import { useVoiceCoach } from "../../hooks/useVoiceCoach";
import type { PoseLandmarks } from "../../hooks/usePoseDetection";
import type { Workout } from "@aifitness/types";

type WorkoutState = "setup" | "generating" | "ready" | "active" | "rest" | "complete";

export default function WorkoutPage() {
  const [wkState, setWkState] = useState<WorkoutState>("setup");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restCountdown, setRestCountdown] = useState(0);
  const [sessionResults, setSessionResults] = useState<
    { name: string; reps: number; formScore: number }[]
  >([]);

  const currentExercise = workout?.exercises[exerciseIdx];
  const exerciseName = currentExercise?.name || "";

  // Hooks
  const tracker = useExerciseTracker(exerciseName);
  const voice = useVoiceCoach();
  const prevRepsRef = useRef(0);
  const prevViolationsRef = useRef<string[]>([]);

  // Generate workout
  async function generateWorkout() {
    setWkState("generating");
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
      setWkState("ready");
    } catch {
      setWkState("setup");
    }
  }

  // Start workout
  function startWorkout() {
    setWkState("active");
    setExerciseIdx(0);
    setCurrentSet(1);
    setSessionResults([]);
    prevRepsRef.current = 0;
    tracker.reset();
    if (workout?.exercises[0]) {
      const ex = workout.exercises[0];
      voice.announceExercise(ex.name, ex.sets, ex.reps);
    }
  }

  // Process pose landmarks each frame
  const handlePoseResults = useCallback(
    (landmarks: PoseLandmarks) => {
      if (wkState !== "active" || !currentExercise) return;

      const result = tracker.processFrame(landmarks);
      if (!result) return;

      // Voice: announce new reps
      if (result.reps > prevRepsRef.current) {
        prevRepsRef.current = result.reps;
        voice.announceRep(result.reps);

        // Check if set complete
        if (result.reps >= currentExercise.reps) {
          if (currentSet < currentExercise.sets) {
            // Start rest period
            voice.speak(`Set ${currentSet} done. Rest.`, `set_done_${currentSet}`);
            startRest(currentExercise.restSeconds);
          } else {
            // Exercise complete, move to next
            finishExercise(result.formScore);
          }
        }
      }

      // Voice: announce form corrections (throttled via cooldown)
      if (result.violations.length > 0) {
        const newViolation = result.violations.find(
          (v) => !prevViolationsRef.current.includes(v)
        );
        if (newViolation) {
          voice.announceCorrection(newViolation);
        }
      }
      prevViolationsRef.current = result.violations;
    },
    [wkState, currentExercise, tracker, voice, currentSet]
  );

  // Rest timer
  function startRest(seconds: number) {
    setWkState("rest");
    setRestCountdown(seconds);
  }

  useEffect(() => {
    if (wkState !== "rest") return;
    if (restCountdown <= 0) {
      // Next set
      setCurrentSet((s) => s + 1);
      tracker.reset();
      prevRepsRef.current = 0;
      setWkState("active");
      voice.speak("Go!", "go");
      return;
    }
    const timer = setTimeout(() => setRestCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [wkState, restCountdown, tracker, voice]);

  // Finish current exercise, move to next
  function finishExercise(formScore: number) {
    setSessionResults((prev) => [
      ...prev,
      { name: exerciseName, reps: tracker.state.reps, formScore },
    ]);

    if (workout && exerciseIdx < workout.exercises.length - 1) {
      const nextIdx = exerciseIdx + 1;
      setExerciseIdx(nextIdx);
      setCurrentSet(1);
      tracker.reset();
      prevRepsRef.current = 0;
      const nextEx = workout.exercises[nextIdx];
      voice.announceExercise(nextEx.name, nextEx.sets, nextEx.reps);
    } else {
      setWkState("complete");
      voice.announceComplete();
    }
  }

  // Skip exercise
  function skipExercise() {
    finishExercise(tracker.state.formScore);
  }

  const cameraActive = wkState === "active" || wkState === "rest";

  return (
    <main className={styles.main}>
      {/* SETUP */}
      {wkState === "setup" && (
        <div className={styles.setup}>
          <h1>Create Your Workout</h1>
          <p className={styles.description}>
            AI generates a workout, then your camera tracks your form in
            real-time
          </p>
          <button className={styles.primaryBtn} onClick={generateWorkout}>
            Generate Workout
          </button>
        </div>
      )}

      {/* GENERATING */}
      {wkState === "generating" && (
        <div className={styles.setup}>
          <div className={styles.spinner} />
          <h2>Generating your workout...</h2>
        </div>
      )}

      {/* READY - show workout plan */}
      {wkState === "ready" && workout && (
        <div className={styles.ready}>
          <h1>{workout.name}</h1>
          <p className={styles.description}>{workout.description}</p>
          <div className={styles.stats}>
            <span>{workout.exercises.length} exercises</span>
            <span>{workout.estimatedDuration} min</span>
            <span>{workout.difficulty}</span>
          </div>
          <div className={styles.exerciseList}>
            {workout.exercises.map((ex, i) => {
              const supported = !!EXERCISE_CONFIGS[ex.name];
              return (
                <div key={i} className={styles.exerciseItem}>
                  <span className={styles.exerciseNum}>{i + 1}</span>
                  <div>
                    <strong>{ex.name}</strong>
                    {supported && (
                      <span className={styles.trackingBadge}>
                        Tracking enabled
                      </span>
                    )}
                    <p>
                      {ex.sets} sets x {ex.reps} reps
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.cameraHint}>
            Your camera will be used for real-time form analysis
          </p>
          <button className={styles.primaryBtn} onClick={startWorkout}>
            Start Workout
          </button>
        </div>
      )}

      {/* ACTIVE WORKOUT */}
      {(wkState === "active" || wkState === "rest") && currentExercise && (
        <div className={styles.activeLayout}>
          <div className={styles.cameraSection}>
            <PoseCamera
              enabled={cameraActive}
              onResults={handlePoseResults}
            />
          </div>

          <div className={styles.infoSection}>
            <ExerciseHUD
              exerciseName={currentExercise.name}
              targetReps={currentExercise.reps}
              targetSets={currentExercise.sets}
              currentSet={currentSet}
              tracker={tracker.state}
            />

            {wkState === "rest" && (
              <div className={styles.restOverlay}>
                <h2>Rest</h2>
                <div className={styles.countdown}>{restCountdown}</div>
                <p>Next set starting soon...</p>
              </div>
            )}

            {currentExercise.instructions && (
              <div className={styles.instructionBox}>
                <strong>How to:</strong>
                <p>{currentExercise.instructions}</p>
              </div>
            )}

            <div className={styles.controls}>
              <button className={styles.skipBtn} onClick={skipExercise}>
                Skip Exercise
              </button>
              <span className={styles.progress}>
                {exerciseIdx + 1} / {workout!.exercises.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {wkState === "complete" && (
        <div className={styles.setup}>
          <h1>Workout Complete!</h1>
          <div className={styles.resultsList}>
            {sessionResults.map((r, i) => (
              <div key={i} className={styles.resultItem}>
                <strong>{r.name}</strong>
                <span>{r.reps} reps</span>
                <span
                  style={{
                    color:
                      r.formScore >= 80
                        ? "var(--success)"
                        : r.formScore >= 50
                          ? "var(--warning)"
                          : "var(--error)",
                  }}
                >
                  {r.formScore}% form
                </span>
              </div>
            ))}
          </div>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              setWkState("setup");
              setWorkout(null);
              voice.stop();
            }}
          >
            New Workout
          </button>
        </div>
      )}
    </main>
  );
}
