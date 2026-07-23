import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import LowStockLots from "./LowStockLots";
import type { ILowStockLots } from "../../../../utils/types/dashboard/main";
import renderWithRouter from "../../../../utils/jestRenderHelper";

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
    renderWithRouter(<LowStockLots loading data={[]} />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    renderWithRouter(<LowStockLots loading={false} data={[]} />);

    expect(screen.getByText(/no low stock lots/i)).toBeInTheDocument();
  });

  test("renders low stock lots", () => {
    renderWithRouter(<LowStockLots loading={false} data={lots} />);

    const { item_name, location_name, available_quantity } = lots[0];

    expect(screen.getByText(item_name)).toBeInTheDocument();
    expect(screen.getByText(location_name)).toBeInTheDocument();
    expect(screen.getByText(String(available_quantity))).toBeInTheDocument();
  });

  test("renders inventory lot link", () => {
    renderWithRouter(<LowStockLots loading={false} data={lots} />);

    expect(
      screen.getByRole("link", { name: lots[0].item_name }),
    ).toHaveAttribute("href", "/inventory/lots/1");
  });
});
