/** Pull a money-like number from speech or text (digits or common English words). */
export function parseSpokenAmount(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;

  const normalized = t
    .replace(/\$/g, ' ')
    .replace(/\s+or\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isNegative =
    /\b(minus|negative)\b/.test(normalized) || normalized.startsWith('minus ');

  const m = normalized.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    return isNegative ? -n : n;
  }

  const numberWords: Record<string, number> = {
    zero: 0,
    oh: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const digitWords: Record<string, string> = {
    zero: '0',
    oh: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
  };

  const intWord = normalized.match(
    new RegExp(`\\b(${Object.keys(numberWords).join('|')})\\b`),
  )?.[1];
  if (intWord) {
    return (isNegative ? -1 : 1) * numberWords[intWord];
  }

  const decMatch = normalized.match(
    new RegExp(
      `\\b(${Object.keys(digitWords).join('|')})\\b\\s+(point|dot)\\s+\\b(${Object.keys(
        digitWords,
      ).join('|')})(?:\\s+\\b(${Object.keys(digitWords).join('|')}))?\\b`,
    ),
  );
  if (decMatch) {
    const intPartWord = decMatch[1];
    const d1 = decMatch[3];
    const d2 = decMatch[4];
    const intPart = numberWords[intPartWord] ?? 0;
    const frac = `${digitWords[d1]}${d2 ? digitWords[d2] : ''}`.padEnd(1, '0');
    const value = parseFloat(`${intPart}.${frac}`);
    return Number.isFinite(value) ? (isNegative ? -value : value) : null;
  }

  return null;
}
