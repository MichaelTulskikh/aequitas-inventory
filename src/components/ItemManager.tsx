import { useEffect, useState } from "react";
import { fetchItemTypes, fetchItems, createItem } from "../api/items";

export default function ItemManager() {
  const [types, setTypes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [typeId, setTypeId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    fetchItemTypes().then((r) => setTypes(r.item_types));
  }, []);

  useEffect(() => {
    if (typeId) {
      fetchItems(typeId).then((r) => setItems(r.items));
    } else {
      setItems([]);
    }
  }, [typeId]);

  const add = async () => {
    if (!typeId || !name || !unit) return;

    await createItem({
      item_type_id: typeId,
      name,
      default_unit: unit,
    });

    setName("");
    setUnit("");
    const r = await fetchItems(typeId);
    setItems(r.items);
  };

  return (
    <>
      <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
        <option value="">Select category</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <button className="toggle-btn" onClick={() => setShowItems((s) => !s)}>
        {showItems ? "Hide Items" : "Show Items"}
      </button>
      
      {showItems && (
        <ul className="admin-list">
          {items.map((i) => (
            <li key={i.id}>
              {i.name} <em>({i.default_unit})</em>
            </li>
          ))}
        </ul>
      )}

      {typeId && (
        <div className="admin-form">
          <input
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Default unit (e.g. each, box)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <button onClick={add}>Add Item</button>
        </div>
      )}
    </>
  );
}
