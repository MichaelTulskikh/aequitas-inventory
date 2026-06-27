import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import LowStockLots from "./LowStockLots";
import type { ILowStockLots } from "../../../../utils/types/dashboard/main";

const lots: ILowStockLots[] = [
  {
    inventory_lot_id: "1",
    item_id: "item-1",
    item_name: "Ibuprofen",
    location_name: "Warehouse A",
    available_quantity: 15,
    attributes: {},
  },
];

describe("LowStockLots", () => {
  test("renders loading skeleton", () => {
    render(
      <MemoryRouter>
        <LowStockLots loading data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    render(
      <MemoryRouter>
        <LowStockLots loading={false} data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/no low stock lots/i)).toBeInTheDocument();
  });

  test("renders low stock lots", () => {
    render(
      <MemoryRouter>
        <LowStockLots loading={false} data={lots} />
      </MemoryRouter>,
    );

    const { item_name, location_name, available_quantity } = lots[0];

    expect(screen.getByText(item_name)).toBeInTheDocument();
    expect(screen.getByText(location_name)).toBeInTheDocument();
    expect(screen.getByText(String(available_quantity))).toBeInTheDocument();
  });

  test("renders inventory lot link", () => {
    render(
      <MemoryRouter>
        <LowStockLots loading={false} data={lots} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: lots[0].item_name }),
    ).toHaveAttribute("href", "/inventory/lots/1");
  });
});
