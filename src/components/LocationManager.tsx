import { useEffect, useState } from "react";
import {
  fetchLocationsTree,
  createLocation,
  type WarehouseNode,
  moveBox,
} from "../api/locations";

type Selected =
  | { type: "root" }
  | { type: "warehouse"; id: string; name: string }
  | { type: "pallet"; id: string; name: string }
  | { type: "box"; id: string; name: string };

export default function LocationManager() {
  const [tree, setTree] = useState<WarehouseNode[]>([]);
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<string>>(
    new Set(),
  );
  const [expandedPallets, setExpandedPallets] = useState<Set<string>>(
    new Set(),
  );

  const [selected, setSelected] = useState<Selected>({ type: "root" });
  const [name, setName] = useState("");

  const [moveTarget, setMoveTarget] = useState<string>("");

  const load = async () => {
    const r = await fetchLocationsTree();
    setTree(r.warehouses);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleWarehouse = (id: string) => {
    setExpandedWarehouses((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePallet = (id: string) => {
    setExpandedPallets((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const add = async () => {
    if (!name.trim()) return;

    let type: "warehouse" | "pallet" | "box";
    let parent_location_id: string | null = null;

    if (selected.type === "root") {
      type = "warehouse";
    } else if (selected.type === "warehouse") {
      type = "pallet";
      parent_location_id = selected.id;
    } else {
      type = "box";
      parent_location_id = selected.id;
    }

    await createLocation({
      name,
      type,
      parent_location_id,
    });

    setName("");
    load();
  };

  return (
    <div className="location-manager">
      {/* LEFT: TREE */}
      <div className="location-tree">
        <h4>Locations</h4>

        <div className="location-list">
          {tree.map((w) => {
            const open = expandedWarehouses.has(w.id);

            return (
              <div key={w.id} className="location-block">
                {/* Warehouse row */}
                <div className="location-row warehouse">
                  <button
                    className="toggle"
                    onClick={() => toggleWarehouse(w.id)}
                  >
                    {open ? "▾" : "▸"}
                  </button>

                  <button
                    className={`location-name ${selected.type === "warehouse" && selected.id === w.id ? "active" : ""}`}
                    onClick={() =>
                      setSelected({ type: "warehouse", id: w.id, name: w.name })
                    }
                  >
                    🏢 {w.name}
                  </button>
                </div>

                {/* Pallets */}
                {open && (
                  <div className="location-children">
                    {w.pallets.map((p) => {
                      const pOpen = expandedPallets.has(p.id);

                      return (
                        <div key={p.id} className="location-block">
                          <div className="location-row pallet">
                            <button
                              className="toggle"
                              onClick={() => togglePallet(p.id)}
                            >
                              {pOpen ? "▾" : "▸"}
                            </button>

                            <button
                              className={`location-name ${selected.type === "pallet" && selected.id === p.id ? "active" : ""}`}
                              onClick={() =>
                                setSelected({
                                  type: "pallet",
                                  id: p.id,
                                  name: p.name,
                                })
                              }
                            >
                              📥 {p.name}
                            </button>
                          </div>

                          {/* Boxes */}
                          {pOpen && (
                            <div className="location-children boxes">
                              {p.boxes.map((b) => (
                                <button
                                  key={b.id}
                                  className={`location-row box ${selected.type === "box" && selected.id === b.id ? "active" : ""}`}
                                  onClick={() =>
                                    setSelected({
                                      type: "box",
                                      id: b.id,
                                      name: b.name,
                                    })
                                  }
                                >
                                  📦 {b.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: ADD PANEL */}
      <div className="location-editor">
        <h4>Edit Locations</h4>

        <div className="editor-context">
          {selected.type === "root" && "Create a new warehouse"}
          {selected.type === "warehouse" &&
            `Add a pallet to "${selected.name}"`}
          {selected.type === "pallet" && `Add a box to "${selected.name}"`}
        </div>
        {selected.type != "box" && (
          <div className="editor-form">
            <label>Location name</label>
            <input
              placeholder={
                selected.type === "root"
                  ? "Warehouse name"
                  : selected.type === "warehouse"
                    ? "Pallet name"
                    : "Box name"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button className="primary" onClick={add}>
              {selected.type === "root"
                ? "Add Warehouse"
                : selected.type === "warehouse"
                  ? "Add Pallet"
                  : "Add Box"}
            </button>
          </div>
        )}

        {selected.type === "box" && (
          <div className="editor-form">
            <h4 style={{ marginTop: 20 }}>Move Box {selected.name}</h4>

            <label>Target Pallet</label>
            <select
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
            >
              <option value="">Select pallet</option>
              {tree.flatMap((w) =>
                w.pallets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {w.name} / {p.name}
                  </option>
                )),
              )}
            </select>

            <button
              className="primary"
              disabled={!moveTarget}
              onClick={async () => {
                await moveBox(selected.id, moveTarget);
                setMoveTarget("");
                load();
              }}
            >
              Move Box
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
