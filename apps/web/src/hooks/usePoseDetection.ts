"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type PoseLandmarks = NormalizedLandmark[];

interface UsePoseDetectionOptions {
  /** Whether detection is active */
  enabled: boolean;
  /** Callback fired each frame with detected landmarks */
  onResults?: (landmarks: PoseLandmarks) => void;
}

/**
 * Hook that manages camera access, MediaPipe Pose Landmarker,
 * and draws skeleton overlay on a canvas.
 */
export function usePoseDetection({ enabled, onResults }: UsePoseDetectionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize MediaPipe model
  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });

    landmarkerRef.current = landmarker;
    return landmarker;
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false,
    });

    streamRef.current = stream;
    video.srcObject = stream;
    await video.play();
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Detection loop
  const detect = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    const drawingUtils = new DrawingUtils(ctx);

    // Clear and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mirror the canvas for selfie view
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Detect pose
    const result = landmarkerRef.current!.detectForVideo(
      video,
      performance.now()
    );

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];

      // Mirror landmarks for selfie view
      const mirrored = landmarks.map((l) => ({
        ...l,
        x: 1 - l.x,
      }));

      // Draw skeleton
      ctx.save();
      drawingUtils.drawConnectors(
        mirrored,
        PoseLandmarker.POSE_CONNECTIONS,
        { color: "#6c63ff", lineWidth: 3 }
      );
      drawingUtils.drawLandmarks(mirrored, {
        color: "#ff6384",
        lineWidth: 1,
        radius: 4,
      });
      ctx.restore();

      // Send landmarks (un-mirrored for angle calculations)
      onResultsRef.current?.(landmarks);
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  // Start/stop based on enabled flag
  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(animFrameRef.current);
      stopCamera();
      setIsReady(false);
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        setIsLoading(true);
        setError(null);

        await initLandmarker();
        if (cancelled) return;

        await startCamera();
        if (cancelled) return;

        setIsReady(true);
        setIsLoading(false);

        // Start detection loop
        animFrameRef.current = requestAnimationFrame(detect);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to start camera");
          setIsLoading(false);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      stopCamera();
    };
  }, [enabled, initLandmarker, startCamera, stopCamera, detect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      stopCamera();
      landmarkerRef.current?.close();
    };
  }, [stopCamera]);

  return { videoRef, canvasRef, isLoading, isReady, error };
}
