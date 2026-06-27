import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import AvailableInventory from "./AvailableInventory";
import type { IInventoryByCategory } from "../../../../utils/types/dashboard/main";

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
    render(
      <MemoryRouter>
        <AvailableInventory loading data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  test("renders empty state", () => {
    render(
      <MemoryRouter>
        <AvailableInventory loading={false} data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/no inventory found/i)).toBeInTheDocument();
  });

  test("renders inventory rows", () => {
    render(
      <MemoryRouter>
        <AvailableInventory loading={false} data={inventory} />
      </MemoryRouter>,
    );
    const { category_name, item_count, total_available_quantity } =
      inventory[0];
    expect(screen.getByText(category_name)).toBeInTheDocument();
    expect(screen.getByText(item_count)).toBeInTheDocument();
    expect(screen.getByText(total_available_quantity)).toBeInTheDocument();
  });

  test("renders inventory link", () => {
    render(
      <MemoryRouter>
        <AvailableInventory loading={false} data={inventory} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /open inventory/i }),
    ).toHaveAttribute("href", "/inventory");
  });
});
