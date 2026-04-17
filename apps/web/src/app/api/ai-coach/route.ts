import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai-coach
 *
 * Sends movement analysis data to Claude API and returns
 * personalized coaching feedback.
 *
 * If ANTHROPIC_API_KEY is not set, returns rule-based feedback as fallback.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exerciseName, repSummary, currentIssues } = body as {
    exerciseName: string;
    repSummary: string;
    currentIssues: string[];
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const feedback = await getClaudeFeedback(
        apiKey,
        exerciseName,
        repSummary,
        currentIssues
      );
      return NextResponse.json({ feedback, source: "ai" });
    } catch (err: any) {
      console.error("Claude API error:", err.message);
      // Fall through to rule-based
    }
  }

  // Fallback: rule-based feedback
  const feedback = getRuleBasedFeedback(exerciseName, currentIssues);
  return NextResponse.json({ feedback, source: "rules" });
}

async function getClaudeFeedback(
  apiKey: string,
  exerciseName: string,
  repSummary: string,
  currentIssues: string[]
): Promise<string> {
  const issueList =
    currentIssues.length > 0
      ? `Current issues: ${currentIssues.join(", ")}`
      : "No major issues detected.";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `You are a concise fitness coach. The user is doing ${exerciseName}.

Here is their rep-by-rep movement data:
${repSummary}

${issueList}

Give ONE short coaching tip (max 2 sentences) addressing their most important issue right now. Be encouraging but specific. If form is good, give a brief encouragement. Speak directly to the user ("you" not "the user").`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function getRuleBasedFeedback(
  exerciseName: string,
  currentIssues: string[]
): string {
  if (currentIssues.length === 0) {
    const encouragements = [
      "Great form! Keep it up.",
      "Looking strong! Maintain that pace.",
      "Excellent technique. Stay focused.",
      "Perfect. You're nailing this.",
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  // Map common issues to coaching tips
  const tips: Record<string, string> = {
    "too_fast":
      "Slow down a bit. Control the movement, especially on the way down.",
    "too_slow":
      "Try to pick up the pace slightly. Maintain a steady rhythm.",
    "limited ROM":
      "Try to go a little deeper on each rep. Range of motion is key.",
    "knee caving":
      "Push your knees outward. They should track over your toes.",
    "imbalance":
      "Focus on keeping both sides even. You're favoring one side.",
    "elbow drifting":
      "Keep your elbows pinned to your sides throughout the movement.",
  };

  for (const issue of currentIssues) {
    const lower = issue.toLowerCase();
    for (const [key, tip] of Object.entries(tips)) {
      if (lower.includes(key.toLowerCase())) return tip;
    }
  }

  return `Watch your form: ${currentIssues[0]}`;
}
