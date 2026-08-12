export function scoreTone(value: number, invert = false) {
  const v = invert ? 100 - value : value;
  if (v >= 70) return { text: "text-good", bg: "bg-good-soft" };
  if (v >= 40) return { text: "text-warn", bg: "bg-warn-soft" };
  return { text: "text-bad", bg: "bg-bad-soft" };
}

export function originalityLabel(score: number): string {
  if (score >= 85) return "Highly original";
  if (score >= 60) return "Mostly original";
  if (score >= 40) return "Some overlap found";
  return "Significant overlap found";
}

export function aiLikelihoodLabel(percent: number): string {
  if (percent < 20) return "Likely Authentic (Human)";
  if (percent < 50) return "Mixed signals";
  if (percent < 75) return "Likely AI-assisted / altered";
  return "Likely AI-generated";
}
