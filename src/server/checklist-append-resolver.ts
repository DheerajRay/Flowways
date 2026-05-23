type ChecklistCandidate = {
  id: string;
  title?: string | null;
  body?: string | null;
  labels?: string[] | null;
};

const REFLECTIVE_GUARDS =
  /\b(i feel|i felt|i am feeling|i'm feeling|today was|i learned|note to self|happy|sad|fun|calm|anxious|burned out)\b/i;
const TASKY_GUARDS =
  /\b(remind|reminder|timer|alarm|tomorrow|next week|am|pm|\d{1,2}:\d{2}|blocked|milestone|handoff|jira)\b/i;
const SPEECH_GUARDS = /\b(why|how|what|when|where|who|because|feel|feeling|think|thinking)\b/i;
const GROCERY_WORDS = /\b(milk|eggs?|bread|chips?|coke|maggi|rice|dal|tea|coffee|sugar|salt|oil|vegetable|fruit|tomato|onion)\b/i;

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeToken(value)
    .split(/\s+/)
    .map((v) => v.trim())
    .filter((v) => v.length >= 2);
}

function parseAmbiguousItems(sourceText: string): string[] {
  const source = sourceText.trim();
  if (!source) return [];
  if (TASKY_GUARDS.test(source)) return [];
  if (SPEECH_GUARDS.test(source)) return [];
  if (/\n/.test(source) || /;/.test(source)) return [];
  if (source.length > 48) return [];
  if (REFLECTIVE_GUARDS.test(source)) return [];

  if (source.includes(",")) {
    const parts = source
      .split(",")
      .map((v) => v.replace(/^\s*\d+\.\s*/, "").trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => p.split(/\s+/).length <= 3)) return parts;
  }

  const andMatch = source.match(/^([a-z][a-z0-9 -]{0,18})\s+and\s+([a-z][a-z0-9 -]{0,18})$/i);
  if (andMatch) {
    const left = andMatch[1].trim();
    const right = andMatch[2].trim();
    if (left && right && left.split(/\s+/).length <= 3 && right.split(/\s+/).length <= 3) {
      return [left, right];
    }
  }
  return [];
}

function checklistLexicalScore(items: string[], candidate: ChecklistCandidate): number {
  const candidateText = `${candidate.title || ""} ${candidate.body || ""}`;
  const haystack = new Set(tokenize(candidateText));
  let hits = 0;
  for (const item of items) {
    for (const token of tokenize(item)) {
      if (haystack.has(token)) hits += 1;
    }
  }
  return hits;
}

function labelOverlapScore(inputLabels: string[], candidateLabels: string[]): number {
  if (!inputLabels.length || !candidateLabels.length) return 0;
  const right = new Set(candidateLabels.map((l) => l.toLowerCase()));
  return inputLabels.reduce((acc, label) => acc + (right.has(label.toLowerCase()) ? 1 : 0), 0);
}

export function resolveAmbiguousChecklistAppend(
  sourceText: string,
  inputLabels: string[],
  openChecklists: ChecklistCandidate[]
): { items: string[]; target: ChecklistCandidate } | null {
  const items = parseAmbiguousItems(sourceText);
  if (!items.length || !openChecklists.length) return null;

  const scored = openChecklists
    .map((candidate) => {
      const lexical = checklistLexicalScore(items, candidate);
      const overlap = labelOverlapScore(inputLabels, candidate.labels || []);
      const inputGroceryBoost = GROCERY_WORDS.test(sourceText) ? 1 : 0;
      const shoppingBoost = /\b(shopping|grocery|groceries)\b/i.test(
        `${candidate.title || ""} ${(candidate.labels || []).join(" ")}`
      )
        ? 1
        : 0;
      return { candidate, score: lexical * 2 + overlap * 3 + shoppingBoost + inputGroceryBoost };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;
  if (best.score >= 3) return { items, target: best.candidate };
  if (openChecklists.length === 1 && items.length >= 2 && !REFLECTIVE_GUARDS.test(sourceText) && !SPEECH_GUARDS.test(sourceText)) {
    return { items, target: openChecklists[0] };
  }
  return null;
}
