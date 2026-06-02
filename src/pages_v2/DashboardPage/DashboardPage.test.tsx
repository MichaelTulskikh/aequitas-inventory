import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi, beforeEach } from "vitest";
import DashboardPage from "./DashboardPage";
import { fetchDashboardSummary } from "../../api/dashboard";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({
    user: {
      roles: ["Admin"],
    },
  }),
}));

vi.mock("../../api/dashboard", () => ({
  fetchDashboardSummary: vi.fn(),
}));

const mockResponse = {
  me: { is_privileged: true },
  summary: {
    shipments_by_status: {
      draft: 1,
      submitted: 2,
      approved: 3,
      fulfilled: 4,
      cancelled: 5,
      rejected: 6,
    },
    my_active_shipments: [
      {
        id: 1,
        shipment_number: "SH-001",
        status: "Draft",
        requester_name: "John Doe",
        line_count: 2,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    recent_fulfilled_shipments: [],
    inventory_by_category: [
      {
        category_id: 1,
        category_name: "Electronics",
        item_count: 10,
        total_available_quantity: 50,
      },
    ],
    low_stock_lots: [],
    expiring_soon_lots: [],
    recent_receives: [],
    recent_adjustments: [],
  },
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue(mockResponse);
  });

  test("renders dashboard summary data", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /dashboard/i }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Shipment Status Overview"),
    ).toBeInTheDocument();

    expect(screen.getByText("SH-001")).toBeInTheDocument();

    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  test("renders privileged sections for admin users", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Low Stock Lots")).toBeInTheDocument();

    expect(screen.getByText("Expiring Soon")).toBeInTheDocument();

    expect(screen.getByText("Recent Receives")).toBeInTheDocument();

    expect(screen.getByText("Recent Adjustments")).toBeInTheDocument();
  });
});
