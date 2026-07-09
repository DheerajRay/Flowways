const TIMELINE_GUARDS =
  /\b(remind|reminder|timer|alarm|tomorrow|next week|am|pm|\d{1,2}:\d{2})\b/i;
const REFLECTIVE_GUARDS =
  /\b(i feel|i felt|i am feeling|i'm feeling|today was|i learned|note to self|happy|sad|fun|calm|anxious|burned out)\b/i;
const GROCERY_WORDS = new Set([
  "milk",
  "egg",
  "eggs",
  "bread",
  "chip",
  "chips",
  "coke",
  "maggi",
  "rice",
  "dal",
  "tea",
  "coffee",
  "sugar",
  "salt",
  "oil",
  "vegetable",
  "vegetables",
  "fruit",
  "fruits",
  "tomato",
  "tomatoes",
  "onion",
  "onions"
]);

function parseNaturalGroceryList(source: string): string[] {
  if (TIMELINE_GUARDS.test(source) || REFLECTIVE_GUARDS.test(source)) return [];

  const normalized = source
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"']/g, " ")
    .replace(/\b(today|please|list|shopping|grocery|groceries|buy|get|bring|pack|pick up|pickup|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const groceryItems = tokens.filter((token) => GROCERY_WORDS.has(token));
  const hasShoppingCue = /\b(buy|get|bring|pack|pick up|pickup|shopping|grocery|groceries)\b/i.test(source);
  if (groceryItems.length >= 2 && (hasShoppingCue || groceryItems.length >= 3)) {
    return groceryItems;
  }
  return [];
}

export function parseListFromText(value: string): string[] {
  const source = value.trim();
  if (!source) return [];

  const numberedInline = [...source.matchAll(/(?:^|\s)\d+[.)]\s+(.+?)(?=(?:\s+\d+[.)]\s+)|$)/g)]
    .map((match) => (match[1] || "").trim())
    .filter(Boolean);
  if (numberedInline.length >= 2) return numberedInline;

  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "").trim());

  if (lines.length >= 2) return lines;

  if (source.includes(",")) {
    const comma = source.split(",").map((token) => token.trim()).filter(Boolean);
    if (comma.length >= 2) return comma;
  }

  return parseNaturalGroceryList(source);
}
