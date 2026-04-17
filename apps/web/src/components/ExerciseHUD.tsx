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
  const formColor =
    tracker.formScore >= 80 ? "var(--success)"
    : tracker.formScore >= 50 ? "var(--warning)"
    : "var(--error)";

  const movementColor =
    tracker.movementScore >= 80 ? "var(--success)"
    : tracker.movementScore >= 50 ? "var(--warning)"
    : "var(--error)";

  const rep = tracker.lastRepAnalysis;

  return (
    <div className={styles.hud}>
      <div className={styles.exerciseName}>{exerciseName}</div>

      {/* Main stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{tracker.reps}</span>
          <span className={styles.statLabel}>/ {targetReps} reps</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>Set {currentSet}</span>
          <span className={styles.statLabel}>/ {targetSets}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: formColor }}>
            {tracker.formScore}%
          </span>
          <span className={styles.statLabel}>form</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: movementColor }}>
            {tracker.movementScore}%
          </span>
          <span className={styles.statLabel}>movement</span>
        </div>
      </div>

      {/* Last rep details */}
      {rep && (
        <div className={styles.repDetails}>
          <div className={styles.repHeader}>Rep {rep.repNumber}</div>
          <div className={styles.repStats}>
            <span>ROM: {rep.rangeOfMotion}&deg;</span>
            <span>
              Tempo:{" "}
              <span className={
                rep.tempo === "good" ? styles.good
                : rep.tempo === "too_fast" ? styles.warning
                : styles.warning
              }>
                {rep.tempo === "good" ? "Good" : rep.tempo === "too_fast" ? "Fast" : "Slow"}
              </span>
            </span>
            <span>{(rep.duration / 1000).toFixed(1)}s</span>
          </div>

          {/* Lateral drift */}
          {rep.lateralDrift.filter(d => d.direction !== "stable").map((d, i) => (
            <div key={`drift-${i}`} className={styles.correction}>
              {"\u26A0"} {d.description}
            </div>
          ))}

          {/* Symmetry */}
          {rep.symmetry.filter(s => s.difference > 8).map((s, i) => (
            <div key={`sym-${i}`} className={styles.correction}>
              {"\u26A0"} {s.description}
            </div>
          ))}
        </div>
      )}

      {/* Form violations */}
      {tracker.violations.length > 0 && (
        <div className={styles.corrections}>
          {tracker.violations.map((v, i) => (
            <div key={i} className={styles.correction}>
              {"\u26A0"} {v}
            </div>
          ))}
        </div>
      )}

      {/* AI coaching tip */}
      {tracker.aiCoachingTip && (
        <div className={styles.aiTip}>
          <div className={styles.aiLabel}>AI Coach</div>
          {tracker.aiCoachingTip}
        </div>
      )}

      <div className={styles.angle}>
        Angle: {tracker.currentAngle}&deg; &bull; Phase:{" "}
        {tracker.phase === "down" ? "\u2B07" : "\u2B06"}
      </div>
    </div>
  );
}
