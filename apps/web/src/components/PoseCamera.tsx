"use client";

import { usePoseDetection, type PoseLandmarks } from "../hooks/usePoseDetection";
import styles from "./PoseCamera.module.css";

interface PoseCameraProps {
  enabled: boolean;
  onResults?: (landmarks: PoseLandmarks) => void;
}

export function PoseCamera({ enabled, onResults }: PoseCameraProps) {
  const { videoRef, canvasRef, isLoading, isReady, error } = usePoseDetection({
    enabled,
    onResults,
  });

  return (
    <div className={styles.container}>
      {/* Hidden video element (camera source) */}
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        muted
      />

      {/* Canvas with skeleton overlay */}
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p>Starting camera...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className={styles.overlay}>
          <p className={styles.error}>{error}</p>
          <p className={styles.hint}>
            Make sure camera permissions are allowed
          </p>
        </div>
      )}

      {/* Idle state */}
      {!enabled && !isLoading && !error && (
        <div className={styles.overlay}>
          <p>Camera will activate when workout starts</p>
        </div>
      )}
    </div>
  );
}
