import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import ExpiringSoon from "./ExpiringSoon";
import { formatDate } from "../../../../utils/dateTimeFormatters";
import type { IExpiringSoonLots } from "../../../../utils/types/dashboard/main";

vi.mock("../../../../utils/dateTimeFormatters", () => ({
  formatDate: vi.fn(() => "01/01/2026"),
}));

const lots: IExpiringSoonLots[] = [
  {
    inventory_lot_id: "1",
    item_id: "item-1",
    item_name: "Ibuprofen",
    expiration_date: "2026-01-01T00:00:00Z",
    location_name: "Warehouse A",
    available_quantity: 15,
    attributes: {},
  },
];

describe("ExpiringSoon", () => {
  test("renders loading skeleton", () => {
    render(
      <MemoryRouter>
        <ExpiringSoon loading data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    render(
      <MemoryRouter>
        <ExpiringSoon loading={false} data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/no expiring lots found/i)).toBeInTheDocument();
  });

  test("renders expiring lots", () => {
    render(
      <MemoryRouter>
        <ExpiringSoon loading={false} data={lots} />
      </MemoryRouter>,
    );

    const { item_name, expiration_date, available_quantity } = lots[0];

    expect(screen.getByText(item_name)).toBeInTheDocument();
    expect(screen.getByText(formatDate(expiration_date))).toBeInTheDocument();
    expect(screen.getByText(String(available_quantity))).toBeInTheDocument();
  });

  test("renders inventory lot link", () => {
    render(
      <MemoryRouter>
        <ExpiringSoon loading={false} data={lots} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: lots[0].item_name }),
    ).toHaveAttribute("href", "/inventory/lots/1");
  });
});
