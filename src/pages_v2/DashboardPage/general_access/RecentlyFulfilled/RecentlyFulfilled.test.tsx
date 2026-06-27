import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import RecentlyFulfilled from "./RecentlyFulfilled";
import { formatDate } from "../../../../utils/dateTimeFormatters";
import type { IRecentlyFulfilledShipments } from "../../../../utils/types/dashboard/main";

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
    render(
      <MemoryRouter>
        <RecentlyFulfilled loading data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    render(
      <MemoryRouter>
        <RecentlyFulfilled loading={false} data={[]} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/no recently fulfilled shipments/i),
    ).toBeInTheDocument();
  });

  test("renders shipment information", () => {
    render(
      <MemoryRouter>
        <RecentlyFulfilled loading={false} data={shipments} />
      </MemoryRouter>,
    );

    const { shipment_number, requester_name, fulfilled_at } = shipments[0];

    expect(screen.getByText(shipment_number)).toBeInTheDocument();
    expect(screen.getByText(requester_name ?? "—")).toBeInTheDocument();
    expect(screen.getByText(formatDate(fulfilled_at))).toBeInTheDocument();
  });

  test("renders em dash when requester is null", () => {
    render(
      <MemoryRouter>
        <RecentlyFulfilled
          loading={false}
          data={[
            {
              ...shipments[0],
              requester_name: null,
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  test("renders shipment link", () => {
    render(
      <MemoryRouter>
        <RecentlyFulfilled loading={false} data={shipments} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: shipments[0].shipment_number }),
    ).toHaveAttribute("href", "/shipments/1");
  });
});
