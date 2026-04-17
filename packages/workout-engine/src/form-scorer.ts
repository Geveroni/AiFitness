import type { FormRule } from "@aifitness/types";

interface ScoringResult {
  score: number; // 0-100
  violations: string[];
}

/**
 * Score exercise form based on a set of angle rules.
 * Each rule checks if a joint angle is within the acceptable range.
 * Score = percentage of rules passed.
 */
export function scoreForm(
  rules: FormRule[],
  angles: Map<string, number>
): ScoringResult {
  if (rules.length === 0) return { score: 100, violations: [] };

  const violations: string[] = [];

  for (const rule of rules) {
    const key = rule.jointAngle.joints.join("-");
    const angle = angles.get(key);
    if (angle === undefined) continue;

    if (angle < rule.jointAngle.minAngle || angle > rule.jointAngle.maxAngle) {
      violations.push(rule.description);
    }
  }

  const passed = rules.length - violations.length;
  const score = Math.round((passed / rules.length) * 100);

  return { score, violations };
}
