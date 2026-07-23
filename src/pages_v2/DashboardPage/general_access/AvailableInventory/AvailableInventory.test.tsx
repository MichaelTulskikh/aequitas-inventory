import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import AvailableInventory from "./AvailableInventory";
import type { IInventoryByCategory } from "../../../../utils/types/dashboard/main";
import renderWithRouter from "../../../../utils/jestRenderHelper";

const inventory: IInventoryByCategory[] = [
  {
    category_id: "1",
    category_name: "Electronics",
    item_count: 10,
    total_available_quantity: 42,
  },
];

describe("AvailableInventory", () => {
  test("renders loading skeleton", () => {
    renderWithRouter(<AvailableInventory loading data={[]} />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    renderWithRouter(<AvailableInventory loading={false} data={[]} />);

    expect(screen.getByText(/no inventory found/i)).toBeInTheDocument();
  });

  test("renders inventory rows", () => {
    renderWithRouter(<AvailableInventory loading={false} data={inventory} />);
    const { category_name, item_count, total_available_quantity } =
      inventory[0];
    expect(screen.getByText(category_name)).toBeInTheDocument();
    expect(screen.getByText(item_count)).toBeInTheDocument();
    expect(screen.getByText(total_available_quantity)).toBeInTheDocument();
  });

  test("renders inventory link", () => {
    renderWithRouter(<AvailableInventory loading={false} data={inventory} />);

    expect(
      screen.getByRole("link", { name: /open inventory/i }),
    ).toHaveAttribute("href", "/inventory");
  });
});
