import { useEffect, useState } from "react";
import "../styles/item-search-picker.css";
import { fetchItems, type Item } from "../api/items";

type Props = {
  onSelect: (item: Item) => void;
};

export default function ItemSearchPicker({ onSelect }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchItems().then((r) => setItems(r.items));
  }, []);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="item-search">
      <input
        placeholder="Search items…"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => setQ(e.target.value)}
        // onBlur={() => setOpen(false)}
      />

      {open && (
        <div className="item-search-menu">
          {filtered.length === 0 ? (
            <div className="item-search-empty">No matches</div>
          ) : (
            filtered.slice(0, 30).map((i) => (
              <button
                key={i.id}
                className="item-search-row"
                onClick={() => {
                  onSelect(i);
                  setQ(i.name);
                  setOpen(false);
                }}
              >
                <div className="name">{i.name}</div>
                <div className="unit">{i.default_unit}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
