export function formatLabel(name: string): string {
  return name
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function downloadCsv(items: any[]) {
  if (!items.length) return;

  // 1) Define stable, human-friendly column order
  const baseColumns = [
    "lot_id",
    "item_name",
    "item_type",
    "on_hand",
    "reserved",
    "available",
    "unit",
    "warehouse_name",
    "pallet_name",
    "box_name",
  ];

  // 2) Collect all attribute keys across items
  const attributeKeys = Array.from(
    new Set(
      items.flatMap((i) =>
        i.attributes ? Object.keys(i.attributes) : []
      )
    )
  );

  const headers = [...baseColumns, ...attributeKeys];

  // 3) Build rows
  const rows = items.map((item) => {
    return headers.map((key) => {
      let value;

      if (key in item) {
        value = item[key];
      } else if (item.attributes && key in item.attributes) {
        value = item.attributes[key];
      } else {
        value = "";
      }

      // Normalize numbers stored as strings
      if (
        typeof value === "string" &&
        value !== "" &&
        !Number.isNaN(Number(value))
      ) {
        value = Number(value);
      }

      return JSON.stringify(value ?? "");
    }).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  // 4) Trigger download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
