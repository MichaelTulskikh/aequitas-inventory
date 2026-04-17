export function parseNumberList(value: string): number[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  );
}

export function normalizeSearchInput(value: string): string {
  return value.trim();
}