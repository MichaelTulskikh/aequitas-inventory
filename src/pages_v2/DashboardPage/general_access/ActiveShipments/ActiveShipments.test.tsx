import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import ActiveShipments from "./ActiveShipments";
import type { IActiveShipments } from "../../../../utils/types/dashboard/main";
import { formatDate } from "../../../../utils/dateTimeFormatters";
import renderWithRouter from "../../../../utils/jestRenderHelper";

vi.mock("../../../../utils/dateTimeFormatters", () => ({
  formatDate: vi.fn(() => "01/01/2026"),
}));

vi.mock("../../../../utils/normalizers", () => ({
  normalizeStatus: vi.fn(() => "draft"),
}));

const shipments: IActiveShipments[] = [
  {
    id: "1",
    shipment_number: "SH-001",
    status: "Draft",
    requester_name: "John Doe",
    created_at: "2026-01-01T00:00:00Z",
    line_count: 3,
  },
];

describe("ActiveShipments", () => {
  test("renders loading skeleton", () => {
    renderWithRouter(<ActiveShipments loading data={[]} />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    renderWithRouter(<ActiveShipments loading={false} data={[]} />);

    expect(screen.getByText(/no active shipments/i)).toBeInTheDocument();
  });

  test("renders shipment information", () => {
    renderWithRouter(<ActiveShipments loading={false} data={shipments} />);
    const { shipment_number, status, created_at, line_count, requester_name } =
      shipments[0];
    expect(screen.getByText(shipment_number)).toBeInTheDocument();
    expect(screen.getByText(status)).toBeInTheDocument();
    expect(screen.getByText(requester_name ?? "—")).toBeInTheDocument();
    expect(screen.getByText(line_count)).toBeInTheDocument();
    expect(screen.getByText(formatDate(created_at))).toBeInTheDocument();
  });

  test("renders em dash when requester is null", () => {
    renderWithRouter(
      <ActiveShipments
        loading={false}
        data={[
          {
            ...shipments[0],
            requester_name: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  test("renders shipment link", () => {
    renderWithRouter(<ActiveShipments loading={false} data={shipments} />);

    expect(
      screen.getByRole("link", { name: shipments[0].shipment_number }),
    ).toHaveAttribute("href", "/shipments/1");
  });
});

// If your component uses any of these, wrap it in a router for tests:
// Link
// NavLink
// useNavigate
// useLocation
// useParams
// Outlet
