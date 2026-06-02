import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import DashboardPage from "./DashboardPage";
import { fetchDashboardSummary } from "../../api/dashboard";

const mockUseAuth = vi.fn();

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../api/dashboard", () => ({
  fetchDashboardSummary: vi.fn(),
}));

vi.mock(
  "./general_access/ShipmentStatusOverview/ShipmentStatusOverview",
  () => ({
    default: () => <div>ShipmentStatusOverview</div>,
  }),
);

vi.mock("./general_access/ActiveShipments/ActiveShipments", () => ({
  default: () => <div>ActiveShipments</div>,
}));

vi.mock("./general_access/RecentlyFulfilled/RecentlyFulfilled", () => ({
  default: () => <div>RecentlyFulfilled</div>,
}));

vi.mock("./general_access/AvailableInventory/AvailableInventory", () => ({
  default: () => <div>AvailableInventory</div>,
}));

vi.mock("./admin_access/LowStockLots/LowStockLots", () => ({
  default: () => <div>LowStockLots</div>,
}));

vi.mock("./admin_access/ExpiringSoon/ExpiringSoon", () => ({
  default: () => <div>ExpiringSoon</div>,
}));

vi.mock("./admin_access/RecentReceivals/RecentReceivals", () => ({
  default: () => <div>RecentReceivals</div>,
}));

vi.mock("./admin_access/RecentAdjustments/RecentAdjustments", () => ({
  default: () => <div>RecentAdjustments</div>,
}));

vi.mock("../../components/common/Loader/Loader", () => ({
  default: () => <div>Loader</div>,
}));

const mockResponse = {
  me: {
    is_privileged: true,
  },
  summary: {
    shipments_by_status: {
      draft: 1,
      submitted: 2,
      approved: 3,
      fulfilled: 4,
      cancelled: 5,
      rejected: 6,
    },
    my_active_shipments: [],
    recent_fulfilled_shipments: [],
    inventory_by_category: [],
    low_stock_lots: [],
    expiring_soon_lots: [],
    recent_receives: [],
    recent_adjustments: [],
  },
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches dashboard data on mount", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ["User"],
      },
    });

    vi.mocked(fetchDashboardSummary).mockResolvedValue(mockResponse as never);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(fetchDashboardSummary).toHaveBeenCalledTimes(1);
    });
  });

  test("shows error when request fails", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ["User"],
      },
    });

    vi.mocked(fetchDashboardSummary).mockRejectedValue(new Error("API Error"));

    render(<DashboardPage />);

    expect(await screen.findByText(/api error/i)).toBeInTheDocument();
  });

  test("renders privileged sections for admin users", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ["Admin"],
      },
    });

    vi.mocked(fetchDashboardSummary).mockResolvedValue(mockResponse as never);

    render(<DashboardPage />);

    expect(
      await screen.findByText("ShipmentStatusOverview"),
    ).toBeInTheDocument();

    expect(screen.getByText("LowStockLots")).toBeInTheDocument();
    expect(screen.getByText("ExpiringSoon")).toBeInTheDocument();
    expect(screen.getByText("RecentReceivals")).toBeInTheDocument();
    expect(screen.getByText("RecentAdjustments")).toBeInTheDocument();
  });

  test("does not render privileged sections for regular users", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ["User"],
      },
    });

    vi.mocked(fetchDashboardSummary).mockResolvedValue(mockResponse as never);

    render(<DashboardPage />);

    expect(
      await screen.findByText("ShipmentStatusOverview"),
    ).toBeInTheDocument();

    expect(screen.queryByText("LowStockLots")).not.toBeInTheDocument();
    expect(screen.queryByText("ExpiringSoon")).not.toBeInTheDocument();
    expect(screen.queryByText("RecentReceivals")).not.toBeInTheDocument();
    expect(screen.queryByText("RecentAdjustments")).not.toBeInTheDocument();
  });

  test("shows loader while data is loading", () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ["User"],
      },
    });

    vi.mocked(fetchDashboardSummary).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<DashboardPage />);

    expect(screen.getByText("Loader")).toBeInTheDocument();
  });
});
