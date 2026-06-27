import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import RecentReceivals from "./RecentReceivals";
import { formatDateTime } from "../../../../utils/dateTimeFormatters";
import type { IRecentReceivals } from "../../../../utils/types/dashboard/main";

vi.mock("../../../../utils/dateTimeFormatters", () => ({
  formatDateTime: vi.fn(() => "01/01/2026 10:00"),
}));

const receives: IRecentReceivals[] = [
  {
    inventory_txn_id: "1",
    occurred_at: "2026-01-01T10:00:00Z",
    item_name: "Ibuprofen",
    quantity: 25,
    location_name: "Warehouse A",
    reason: "Initial stock",
  },
];

describe("RecentReceivals", () => {
  test("renders loading skeleton", () => {
    render(<RecentReceivals loading data={[]} />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    render(<RecentReceivals loading={false} data={[]} />);

    expect(screen.getByText(/no recent receives/i)).toBeInTheDocument();
  });

  test("renders receive information", () => {
    render(<RecentReceivals loading={false} data={receives} />);

    const { occurred_at, item_name, quantity, location_name } = receives[0];

    expect(screen.getByText(formatDateTime(occurred_at))).toBeInTheDocument();
    expect(screen.getByText(item_name)).toBeInTheDocument();
    expect(screen.getByText(String(quantity))).toBeInTheDocument();
    expect(screen.getByText(location_name)).toBeInTheDocument();
  });
});
