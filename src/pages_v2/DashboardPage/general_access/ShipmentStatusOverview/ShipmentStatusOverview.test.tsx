import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ShipmentStatusOverview from "./ShipmentStatusOverview";
import type { IShipmentsByStatus } from "../../../../utils/types/dashboard/main";

const shipmentStatus: IShipmentsByStatus = {
  draft: 1,
  submitted: 2,
  approved: 3,
  fulfilled: 4,
  cancelled: 5,
  rejected: 6,
};

describe("ShipmentStatusOverview", () => {
  test("renders loading skeleton", () => {
    render(<ShipmentStatusOverview loading data={null} />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders shipment status cards", () => {
    render(<ShipmentStatusOverview loading={false} data={shipmentStatus} />);

    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Fulfilled")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  test("renders nothing when data is null and not loading", () => {
    render(<ShipmentStatusOverview loading={false} data={null} />);

    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(screen.queryByText("Submitted")).not.toBeInTheDocument();
  });
});

// getBy* → element must be there.
// queryBy* → element must not be there.
// findBy* → element will appear asynchronously (e.g., after an API call or state update).
