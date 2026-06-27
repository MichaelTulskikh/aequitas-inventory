import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import RecentAdjustments from "./RecentAdjustments";
import { formatDateTime } from "../../../../utils/dateTimeFormatters";
import type { IRecentAdjustments } from "../../../../utils/types/dashboard/main";

vi.mock("../../../../utils/dateTimeFormatters", () => ({
  formatDateTime: vi.fn(() => "01/01/2026 10:00"),
}));

const adjustments: IRecentAdjustments[] = [
  {
    inventory_txn_id: "1",
    occurred_at: "2026-01-01T10:00:00Z",
    item_name: "Ibuprofen",
    quantity: -5,
    location_name: "Warehouse A",
    reason: "Correction",
  },
];

describe("RecentAdjustments", () => {
  test("renders loading skeleton", () => {
    render(<RecentAdjustments loading data={[]} />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    render(<RecentAdjustments loading={false} data={[]} />);

    expect(screen.getByText(/no recent adjustments/i)).toBeInTheDocument();
  });

  test("renders adjustment information", () => {
    render(<RecentAdjustments loading={false} data={adjustments} />);

    const { occurred_at, item_name, quantity, location_name } = adjustments[0];

    expect(screen.getByText(formatDateTime(occurred_at))).toBeInTheDocument();
    expect(screen.getByText(item_name)).toBeInTheDocument();
    expect(screen.getByText(String(quantity))).toBeInTheDocument();
    expect(screen.getByText(location_name)).toBeInTheDocument();
  });
});
