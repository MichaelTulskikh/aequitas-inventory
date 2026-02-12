import { useEffect, useState } from "react";
import { fetchLocationsTree } from "../api/locations";
import { type WarehouseNode } from "../api/locations";


export default function LocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (locationId: string) => void;
}) {
  const [tree, setTree] = useState<WarehouseNode[]>([]);
  const [warehouse, setWarehouse] = useState("");
  const [pallet, setPallet] = useState("");

  useEffect(() => {
    fetchLocationsTree().then(r => setTree(r.warehouses));
  }, []);

  const pallets =
    tree.find(w => w.id === warehouse)?.pallets || [];

  const boxes =
    pallets.find(p => p.id === pallet)?.boxes || [];

  return (
    <>
      <select value={warehouse} onChange={e => setWarehouse(e.target.value)}>
        <option value="" disabled hidden>Warehouse</option>
        {tree.map(w => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>

      <select value={pallet} onChange={e => setPallet(e.target.value)}>
        <option value="" disabled hidden>Pallet</option>
        {pallets.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="" disabled hidden>Box</option>
        {boxes.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </>
  );
}
