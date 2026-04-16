import { Landmark } from "@/types/pose";
import { POSE_CONNECTIONS } from "./landmarks";

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  color = "#00FF00",
  radius = 4
) {
  ctx.fillStyle = color;
  for (const lm of landmarks) {
    if (lm.visibility < 0.5) continue;
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  color = "#00FF00",
  lineWidth = 2
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const [i, j] of POSE_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b) continue;
    if (a.visibility < 0.5 || b.visibility < 0.5) continue;

    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  }
}

export function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  formScore = 100
) {
  ctx.clearRect(0, 0, width, height);

  const color = formScore > 70 ? "#22c55e" : formScore > 40 ? "#eab308" : "#ef4444";

  drawConnections(ctx, landmarks, width, height, color, 3);
  drawLandmarks(ctx, landmarks, width, height, "#ffffff", 5);
}
