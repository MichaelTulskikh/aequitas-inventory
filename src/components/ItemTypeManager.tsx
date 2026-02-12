import { useEffect, useState } from "react";
import { fetchItemTypes, createItemType, type ItemType } from "../api/items";

export default function ItemTypeManager() {
  const [types, setTypes] = useState<ItemType[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const r = await fetchItemTypes();
    setTypes(r.item_types);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    await createItemType({ name });
    setName("");
    load();
  };

  return (
    <>
      <ul className="admin-list">
        {types.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>

      <div className="admin-form">
        <input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={add}>Add Category</button>
      </div>
    </>
  );
}
