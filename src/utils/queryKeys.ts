const INVENTORY_QUERY_KEYS = {
  catalog: "inventory-catalog",
  categories: "inventory-categories",
  tags: "inventory-tags",
  items: "inventory-items",
  itemAttributeDefinitions: "inventory-item-attribute-definitions",
  locationsTree: "inventory-locations-tree",
  lot: "inventory-lot",
};

export const QUERY_KEYS = {
  dashboard: {
    summary: "dashboard-summary",
  },
  inventory: INVENTORY_QUERY_KEYS,
  //    users: {
  //     all: ["users"] as const,
  //     detail: (id: string) => ["users", id] as const,
  //   },
  // Fetch one product
  // queryKey: QUERY_KEYS.products.detail(productId)
};
