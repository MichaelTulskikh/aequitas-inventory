import { useState } from "react";

export function useInventoryLotExpansion() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  function isExpanded(itemId: string) {
    return !!expandedItems[itemId];
  }

  function toggleExpanded(itemId: string) {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }

  function collapseAll() {
    setExpandedItems({});
  }

  return {
    expandedItems,
    isExpanded,
    toggleExpanded,
    collapseAll,
  };
}