import { screen, waitFor } from "@testing-library/react";
import DashboardPage from "./DashboardPage";
import { fetchDashboardSummary } from "../../api/dashboard";
import { useAuth } from "../../auth/AuthContext";
import renderWithRouter from "../../utils/jestRenderHelper";

jest.mock("../../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../api/dashboard", () => ({
  fetchDashboardSummary: jest.fn(),
}));

const mockData = {
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
        id: "1",
        shipment_number: "SHP-001",
        status: "Draft",
        requester_name: "John",
        line_count: 2,
        created_at: "2024-01-01",
      },
    ],
    recent_fulfilled_shipments: [],
    inventory_by_category: [],
    low_stock_lots: [],
    expiring_soon_lots: [],
    recent_receives: [],
    recent_adjustments: [],
  },
};

const cases = [
  {
    name: "full data (admin)",
    auth: { roles: ["Admin"] },
    data: mockData,
  },
  {
    name: "empty tables",
    auth: { roles: ["Admin"] },
    data: {
      summary: {
        ...mockData.summary,
        my_active_shipments: [],
        inventory_by_category: [],
      },
    },
  },
  {
    name: "non-privileged user",
    auth: { roles: ["User"] },
    data: mockData,
  },
  {
    name: "error state",
    auth: { roles: ["Admin"] },
    error: "Failed to load",
  },
];

const sections = [
  {
    name: "shipment status overview",
    get: () =>
      screen
        .queryByText("Shipment Status Overview")
        ?.closest("section")
        ?.querySelector("table"),
  },
  {
    name: "status cards grid",
    get: () =>
      screen
        .queryByText("Shipment Status Overview")
        ?.parentElement?.querySelector(".dashboard-card-grid"),
  },

  {
    name: "my active shipments table",
    get: () =>
      screen
        .queryByText("My Active Shipments")
        ?.closest("section")
        ?.querySelector("table"),
  },

  {
    name: "recently fulfilled table",
    get: () =>
      screen
        .queryByText("Recently Fulfilled")
        ?.closest("section")
        ?.querySelector("table"),
  },

  {
    name: "inventory by category table",
    get: () =>
      screen
        .queryByText("Available Inventory by Category")
        ?.closest("section")
        ?.querySelector("table"),
  },

  {
    name: "low stock lots table",
    get: () =>
      screen
        .queryByText("Low Stock Lots")
        ?.closest("section")
        ?.querySelector("table"),
  },

  {
    name: "expiring soon table",
    get: () =>
      screen
        .queryByText("Expiring Soon")
        ?.closest("section")
        ?.querySelector("table"),
  },

  {
    name: "recent receives table",
    get: () =>
      screen
        .queryByText("Recent Receives")
        ?.closest("section")
        ?.querySelector("table"),
  },

  {
    name: "recent adjustments table",
    get: () =>
      screen
        .queryByText("Recent Adjustments")
        ?.closest("section")
        ?.querySelector("table"),
  },
];

cases.forEach((c) => {
  describe(c.name, () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ user: c.auth });

      if (c.error) {
        (fetchDashboardSummary as jest.Mock).mockRejectedValue(
          new Error(c.error),
        );
      } else {
        (fetchDashboardSummary as jest.Mock).mockResolvedValue(c.data);
      }
    });

    sections.forEach((s) => {
      it(`snapshot - ${s.name}`, async () => {
        renderWithRouter(<DashboardPage />);

        // wait for async load to finish
        const el = await waitFor(() => s.get());

        if (!el) return; // skip snapshot if the role doesn't allow the access

        expect(el).toMatchSnapshot();
      });
    });
  });
});
