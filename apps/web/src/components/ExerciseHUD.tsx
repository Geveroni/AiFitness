"use client";

import type { TrackerState } from "../hooks/useExerciseTracker";
import styles from "./ExerciseHUD.module.css";

interface ExerciseHUDProps {
  exerciseName: string;
  targetReps: number;
  targetSets: number;
  currentSet: number;
  tracker: TrackerState;
}

export function ExerciseHUD({
  exerciseName,
  targetReps,
  targetSets,
  currentSet,
  tracker,
}: ExerciseHUDProps) {
  const scoreColor =
    tracker.formScore >= 80
      ? "var(--success)"
      : tracker.formScore >= 50
        ? "var(--warning)"
        : "var(--error)";

  return (
    <div className={styles.hud}>
      <div className={styles.exerciseName}>{exerciseName}</div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{tracker.reps}</span>
          <span className={styles.statLabel}>/ {targetReps} reps</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statValue}>
            Set {currentSet}
          </span>
          <span className={styles.statLabel}>/ {targetSets}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: scoreColor }}>
            {tracker.formScore}%
          </span>
          <span className={styles.statLabel}>form</span>
        </div>
      </div>

      {tracker.violations.length > 0 && (
        <div className={styles.corrections}>
          {tracker.violations.map((v, i) => (
            <div key={i} className={styles.correction}>
              &#9888; {v}
            </div>
          ))}
        </div>
      )}

      <div className={styles.angle}>
        Angle: {tracker.currentAngle}&deg; &bull; Phase:{" "}
        {tracker.phase === "down" ? "&#11015;" : "&#11014;"}
      </div>
    </div>
  );
}
