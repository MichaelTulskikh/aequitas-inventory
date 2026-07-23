import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import RecentlyFulfilled from "./RecentlyFulfilled";
import { formatDate } from "../../../../utils/dateTimeFormatters";
import type { IRecentlyFulfilledShipments } from "../../../../utils/types/dashboard/main";
import renderWithRouter from "../../../../utils/jestRenderHelper";

vi.mock("../../../../utils/dateTimeFormatters", () => ({
  formatDate: vi.fn(() => "01/01/2026"),
}));

const shipments: IRecentlyFulfilledShipments[] = [
  {
    id: "1",
    shipment_number: "SH-001",
    requester_name: "John Doe",
    fulfilled_at: "2026-01-01T10:00:00Z",
  },
];

describe("RecentlyFulfilled", () => {
  test("renders loading skeleton", () => {
    renderWithRouter(<RecentlyFulfilled loading data={[]} />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    renderWithRouter(<RecentlyFulfilled loading={false} data={[]} />);

    expect(
      screen.getByText(/no recently fulfilled shipments/i),
    ).toBeInTheDocument();
  });

  test("renders shipment information", () => {
    renderWithRouter(<RecentlyFulfilled loading={false} data={shipments} />);

    const { shipment_number, requester_name, fulfilled_at } = shipments[0];

    expect(screen.getByText(shipment_number)).toBeInTheDocument();
    expect(screen.getByText(requester_name ?? "—")).toBeInTheDocument();
    expect(screen.getByText(formatDate(fulfilled_at))).toBeInTheDocument();
  });

  test("renders em dash when requester is null", () => {
    renderWithRouter(
      <RecentlyFulfilled
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
    renderWithRouter(<RecentlyFulfilled loading={false} data={shipments} />);

    expect(
      screen.getByRole("link", { name: shipments[0].shipment_number }),
    ).toHaveAttribute("href", "/shipments/1");
  });
});
