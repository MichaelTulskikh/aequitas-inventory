export function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  return String(value);
}

export function formatCategoryPath(path?: string[] | null): string {
  if (!path || path.length === 0) return "—";
  return path.join(" / ");
}

export function formatLotCount(count: number): string {
  return `${count} lot${count === 1 ? "" : "s"} available`;
}