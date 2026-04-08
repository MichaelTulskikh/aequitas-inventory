import React, { useEffect, useMemo, useState } from "react";
import { Group, Layer, Rect, Stage, Text } from "react-konva";

type BoxItem = {
  id: string;
  label: string;
};

type PalletType = {
  id: string;
  label: string;
  width: number; // warehouse units
  height: number; // warehouse units
  color: string;
};

type Pallet = {
  id: string;
  palletTypeId: string;
  label: string;
  x: number; // warehouse units
  y: number; // warehouse units
  rotation: 0 | 90;
  boxes: BoxItem[];
};

const WAREHOUSE = {
  width: 1200,
  height: 700,
};

const GRID_SIZE = 20;

/**
 * Extra visual scaling for pallets so they appear bigger on screen
 * without changing their logical warehouse coordinates.
 */
const PALLET_VISUAL_SCALE = 1.45;

const PALLET_TYPES: PalletType[] = [
  {
    id: "us-48x40",
    label: 'US 48"×40"',
    width: 48,
    height: 40,
    color: "#cfe8ff",
  },
  {
    id: "eu-120x80",
    label: "EU 120×80",
    width: 47.24,
    height: 31.5,
    color: "#d9f7be",
  },
  {
    id: "long",
    label: "Long Pallet",
    width: 72,
    height: 40,
    color: "#ffe7ba",
  },
];

const INITIAL_PALLETS: Pallet[] = (() => {
  const pallets: Pallet[] = [];
//   const palletTypeIds = ["us-48x40", "eu-120x80", "long"] as const;

  let palletNumber = 1;
  let boxNumber = 1;

  const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const createBoxes = (currentPalletNumber: number): BoxItem[] => {
    const boxCount = randomInt(5, 15);

    return Array.from({ length: boxCount }, () => {
      const currentBoxNumber = boxNumber++;
      return {
        id: `AEQ-KYIV-P${currentPalletNumber}-B${currentBoxNumber}`,
        label: `Box ${currentBoxNumber}`,
      };
    });
  };

  const createPallet = (x: number, y: number): Pallet => {
    const currentPalletNumber = palletNumber++;
    return {
      id: `AEQ-KYIV-P${currentPalletNumber}`,
      palletTypeId: "eu-120x80",
      label: `Pallet ${currentPalletNumber}`,
      x,
      y,
      rotation: 0,
      boxes: createBoxes(currentPalletNumber),
    };
  };

  // First column: 10 pallets
  for (let row = 0; row < 10; row++) {
    pallets.push(createPallet(80, 40 + row * 65));
  }

  // Second column: 8 pallets
  for (let row = 0; row < 8; row++) {
    pallets.push(createPallet(220, 40 + row * 65));
  }

  return pallets;
})();

function snap(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function getPalletType(palletTypeId: string): PalletType {
  const type = PALLET_TYPES.find((p) => p.id === palletTypeId);
  if (!type) {
    throw new Error(`Unknown pallet type: ${palletTypeId}`);
  }
  return type;
}

function getLogicalFootprint(pallet: Pallet) {
  const type = getPalletType(pallet.palletTypeId);
  const rotated = pallet.rotation === 90;

  return {
    width: rotated ? type.height : type.width,
    height: rotated ? type.width : type.height,
    color: type.color,
    typeLabel: type.label,
  };
}

function getResponsiveStageSize() {
  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1440;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 900;

  const maxCanvasWidth = Math.max(420, Math.min(viewportWidth - 420, 1200));
  const maxCanvasHeight = Math.max(360, Math.min(viewportHeight - 220, 760));

  const scale = Math.min(
    maxCanvasWidth / WAREHOUSE.width,
    maxCanvasHeight / WAREHOUSE.height,
  );

  return {
    scale,
    width: WAREHOUSE.width * scale,
    height: WAREHOUSE.height * scale,
  };
}

function overlaps(a: Pallet, b: Pallet) {
  const af = getLogicalFootprint(a);
  const bf = getLogicalFootprint(b);

  return !(
    a.x + af.width <= b.x ||
    b.x + bf.width <= a.x ||
    a.y + af.height <= b.y ||
    b.y + bf.height <= a.y
  );
}

function wouldOverlapAny(candidate: Pallet, all: Pallet[]) {
  return all.some((p) => p.id !== candidate.id && overlaps(candidate, p));
}

function clampPalletPosition(pallet: Pallet, nextX: number, nextY: number) {
  const logical = getLogicalFootprint(pallet);

  const x = Math.max(0, Math.min(nextX, WAREHOUSE.width - logical.width));
  const y = Math.max(0, Math.min(nextY, WAREHOUSE.height - logical.height));

  return { x, y };
}

type EditableForm = {
  label: string;
  palletTypeId: string;
  x: string;
  y: string;
  rotation: "0" | "90";
};

export default function WarehouseMapTab() {
  const [pallets, setPallets] = useState<Pallet[]>(INITIAL_PALLETS);
  const [selectedPalletId, setSelectedPalletId] = useState<string | null>(
    INITIAL_PALLETS[0]?.id ?? null,
  );
  const [stageScale, setStageScale] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditableForm | null>(null);

  const stageSize = useMemo(() => getResponsiveStageSize(), []);
  const baseScale = stageSize.scale;

  const selectedPallet =
    pallets.find((p) => p.id === selectedPalletId) ?? null;

  useEffect(() => {
    if (!selectedPallet || !isEditMode) {
      setEditForm(null);
      return;
    }

    setEditForm({
      label: selectedPallet.label,
      palletTypeId: selectedPallet.palletTypeId,
      x: String(selectedPallet.x),
      y: String(selectedPallet.y),
      rotation: String(selectedPallet.rotation) as "0" | "90",
    });
  }, [selectedPallet, isEditMode]);

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();

    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = 1.08;
    const nextScale =
      direction > 0 ? stageScale * factor : stageScale / factor;

    setStageScale(Math.max(0.7, Math.min(nextScale, 2.5)));
  };

  const handleDragEnd = (palletId: string, canvasX: number, canvasY: number) => {
    const warehouseX = snap(canvasX / baseScale);
    const warehouseY = snap(canvasY / baseScale);

    setPallets((prev) => {
      const current = prev.find((p) => p.id === palletId);
      if (!current) return prev;

      const clamped = clampPalletPosition(current, warehouseX, warehouseY);
      const candidate: Pallet = { ...current, x: clamped.x, y: clamped.y };

      if (wouldOverlapAny(candidate, prev)) {
        return prev;
      }

      return prev.map((p) => (p.id === palletId ? candidate : p));
    });
  };

  const addPallet = (palletTypeId: string) => {
    // const type = getPalletType(palletTypeId);

    const newPallet: Pallet = {
      id: `P-${Date.now()}`,
      palletTypeId,
      label: `P-${Date.now().toString().slice(-5)}`,
      x: 20,
      y: 20,
      rotation: 0,
      boxes: [],
    };

    const clamped = clampPalletPosition(newPallet, newPallet.x, newPallet.y);
    const candidate = { ...newPallet, x: clamped.x, y: clamped.y };

    if (wouldOverlapAny(candidate, pallets)) return;

    setPallets((prev) => [...prev, candidate]);
    setSelectedPalletId(candidate.id);
    setIsEditMode(false);
  };

  const removeSelected = () => {
    if (!selectedPallet) return;

    setPallets((prev) => prev.filter((p) => p.id !== selectedPallet.id));

    setSelectedPalletId((prevId) => {
      if (prevId !== selectedPallet.id) return prevId;
      const remaining = pallets.filter((p) => p.id !== selectedPallet.id);
      return remaining[0]?.id ?? null;
    });

    setIsEditMode(false);
  };

  const saveEdit = () => {
    if (!selectedPallet || !editForm) return;

    const nextX = Number(editForm.x);
    const nextY = Number(editForm.y);

    if (Number.isNaN(nextX) || Number.isNaN(nextY)) {
      alert("X and Y must be valid numbers.");
      return;
    }

    const candidateBase: Pallet = {
      ...selectedPallet,
      label: editForm.label.trim() || selectedPallet.label,
      palletTypeId: editForm.palletTypeId,
      rotation: Number(editForm.rotation) as 0 | 90,
      x: snap(nextX),
      y: snap(nextY),
    };

    const clamped = clampPalletPosition(
      candidateBase,
      candidateBase.x,
      candidateBase.y,
    );

    const candidate: Pallet = {
      ...candidateBase,
      x: clamped.x,
      y: clamped.y,
    };

    if (wouldOverlapAny(candidate, pallets)) {
      alert("That pallet position or size would overlap another pallet.");
      return;
    }

    setPallets((prev) =>
      prev.map((p) => (p.id === selectedPallet.id ? candidate : p)),
    );
    setIsEditMode(false);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
  };

  const selectedFootprint = selectedPallet
    ? getLogicalFootprint(selectedPallet)
    : null;

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <strong>Warehouse Map</strong>
          <span style={styles.muted}>
            {WAREHOUSE.width} × {WAREHOUSE.height} warehouse units
          </span>
        </div>

        <div style={styles.toolbarRight}>
          {PALLET_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => addPallet(type.id)}
              style={styles.button}
            >
              Add {type.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.canvasCard} onWheel={handleWheel}>
          <div style={styles.canvasHeader}>
            <span>
              Drag pallets to reposition them. The warehouse background stays
              fixed.
            </span>

            <div style={styles.canvasActions}>
              <button
                type="button"
                style={styles.button}
                onClick={() => setStageScale(1)}
              >
                Reset Zoom
              </button>
            </div>
          </div>

          <Stage
            width={stageSize.width}
            height={stageSize.height}
            scaleX={stageScale}
            scaleY={stageScale}
            style={{ background: "#fafafa", borderRadius: 8 }}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                fill="#ffffff"
                stroke="#cfcfcf"
                strokeWidth={2}
              />

              {Array.from({
                length: Math.floor(WAREHOUSE.width / GRID_SIZE) + 1,
              }).map((_, i) => (
                <Rect
                  key={`v-${i}`}
                  x={i * GRID_SIZE * baseScale}
                  y={0}
                  width={1}
                  height={stageSize.height}
                  fill="#f1f1f1"
                  listening={false}
                />
              ))}

              {Array.from({
                length: Math.floor(WAREHOUSE.height / GRID_SIZE) + 1,
              }).map((_, i) => (
                <Rect
                  key={`h-${i}`}
                  x={0}
                  y={i * GRID_SIZE * baseScale}
                  width={stageSize.width}
                  height={1}
                  fill="#f1f1f1"
                  listening={false}
                />
              ))}

              <Text
                x={12}
                y={12}
                text="Warehouse Frame"
                fontSize={16}
                fill="#444"
                listening={false}
              />

              {pallets.map((pallet) => {
                const logical = getLogicalFootprint(pallet);
                const isSelected = pallet.id === selectedPalletId;

                const palletWidthPx =
                  logical.width * baseScale * PALLET_VISUAL_SCALE;
                const palletHeightPx =
                  logical.height * baseScale * PALLET_VISUAL_SCALE;

                const groupX = pallet.x * baseScale;
                const groupY = pallet.y * baseScale;

                return (
                  <Group
                    key={pallet.id}
                    x={groupX}
                    y={groupY}
                    draggable
                    onClick={() => {
                      setSelectedPalletId(pallet.id);
                      setIsEditMode(false);
                    }}
                    onTap={() => {
                      setSelectedPalletId(pallet.id);
                      setIsEditMode(false);
                    }}
                    onDragEnd={(e) => {
                      handleDragEnd(pallet.id, e.target.x(), e.target.y());
                    }}
                  >
                    <Rect
                      width={palletWidthPx}
                      height={palletHeightPx}
                      fill={logical.color}
                      stroke={isSelected ? "#1677ff" : "#666"}
                      strokeWidth={isSelected ? 3 : 1.5}
                      cornerRadius={5}
                      shadowBlur={isSelected ? 7 : 0}
                      shadowOpacity={0.14}
                    />

                    <Text
                      x={8}
                      y={8}
                      width={Math.max(40, palletWidthPx - 16)}
                      text={pallet.label}
                      fontSize={13}
                      fontStyle="bold"
                      fill="#222"
                      listening={false}
                    />

                    <Text
                      x={0}
                      y={palletHeightPx + 6}
                      width={palletWidthPx}
                      align="center"
                      text={`${pallet.boxes.length} box${
                        pallet.boxes.length === 1 ? "" : "es"
                      }`}
                      fontSize={12}
                      fill="#444"
                      listening={false}
                    />
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>

        <aside style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Pallet Details</h3>

              {selectedPallet && !isEditMode && (
                <button
                  type="button"
                  style={styles.button}
                  onClick={() => setIsEditMode(true)}
                >
                  Edit
                </button>
              )}

              {selectedPallet && isEditMode && (
                <button
                  type="button"
                  style={styles.button}
                  onClick={cancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {!selectedPallet ? (
              <div style={styles.emptyState}>Select a pallet.</div>
            ) : (
              <>
                {!isEditMode ? (
                  <>
                    <DisplayRow label="ID" value={selectedPallet.id} />
                    <DisplayRow label="Pallet Number" value={selectedPallet.label} />
                    <DisplayRow
                      label="Type"
                      value={selectedFootprint?.typeLabel ?? ""}
                    />
                    <DisplayRow
                      label="Position"
                      value={`(${selectedPallet.x}, ${selectedPallet.y})`}
                    />
                    <DisplayRow
                      label="Rotation"
                      value={`${selectedPallet.rotation}°`}
                    />
                    <DisplayRow
                      label="Boxes"
                      value={String(selectedPallet.boxes.length)}
                    />
                  </>
                ) : (
                  <>
                    <FieldBlock label="Pallet Number">
                      <input
                        type="text"
                        value={editForm?.label ?? ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, label: e.target.value }
                              : prev,
                          )
                        }
                        style={styles.input}
                      />
                    </FieldBlock>

                    <FieldBlock label="Type">
                      <select
                        value={editForm?.palletTypeId ?? ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, palletTypeId: e.target.value }
                              : prev,
                          )
                        }
                        style={styles.input}
                      >
                        {PALLET_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </FieldBlock>

                    <div style={styles.twoCol}>
                      <FieldBlock label="X">
                        <input
                          type="number"
                          value={editForm?.x ?? ""}
                          onChange={(e) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, x: e.target.value } : prev,
                            )
                          }
                          style={styles.input}
                        />
                      </FieldBlock>

                      <FieldBlock label="Y">
                        <input
                          type="number"
                          value={editForm?.y ?? ""}
                          onChange={(e) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, y: e.target.value } : prev,
                            )
                          }
                          style={styles.input}
                        />
                      </FieldBlock>
                    </div>

                    <FieldBlock label="Rotation">
                      <select
                        value={editForm?.rotation ?? "0"}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rotation: e.target.value as "0" | "90",
                                }
                              : prev,
                          )
                        }
                        style={styles.input}
                      >
                        <option value="0">0°</option>
                        <option value="90">90°</option>
                      </select>
                    </FieldBlock>

                    <div style={styles.actionRow}>
                      <button
                        type="button"
                        style={styles.primaryButton}
                        onClick={saveEdit}
                      >
                        Save Changes
                      </button>
                    </div>
                  </>
                )}

                <div style={{ marginTop: 18 }}>
                  <div style={styles.detailLabel}>Boxes</div>
                  {selectedPallet.boxes.length === 0 ? (
                    <div style={styles.emptyState}>No boxes linked yet.</div>
                  ) : (
                    <ul style={styles.boxList}>
                      {selectedPallet.boxes.map((box) => (
                        <li key={box.id} style={styles.boxListItem}>
                          <span>{box.label}</span>
                          <span style={styles.muted}>{box.id}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={styles.actionRow}>
                  <button
                    type="button"
                    style={styles.dangerButton}
                    onClick={removeSelected}
                  >
                    Remove Pallet
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function DisplayRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.fieldBlock}>
      <label style={styles.detailLabel}>{label}</label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 16,
    display: "grid",
    gap: 16,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  toolbarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  toolbarRight: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 340px",
    gap: 16,
    alignItems: "start",
  },
  canvasCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
    overflow: "auto",
  },
  canvasHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
    fontSize: 14,
    color: "#555",
  },
  canvasActions: {
    display: "flex",
    gap: 8,
  },
  sidebar: {
    minWidth: 0,
  },
  sidebarCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    position: "sticky",
    top: 16,
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 18,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
    fontSize: 14,
  },
  detailLabel: {
    color: "#666",
    fontWeight: 600,
  },
  actionRow: {
    display: "flex",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
  },
  button: {
    border: "1px solid #d0d7de",
    background: "#fff",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
  },
  primaryButton: {
    border: "1px solid #1677ff",
    background: "#1677ff",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    width: "100%",
  },
  dangerButton: {
    border: "1px solid #d92d20",
    background: "#fff5f5",
    color: "#d92d20",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
  },
  boxList: {
    listStyle: "none",
    padding: 0,
    margin: "8px 0 0",
    display: "grid",
    gap: 8,
  },
  boxListItem: {
    border: "1px solid #f0f0f0",
    borderRadius: 8,
    padding: "8px 10px",
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 14,
  },
  muted: {
    color: "#777",
    fontSize: 13,
  },
  emptyState: {
    color: "#777",
    fontSize: 14,
    padding: "8px 0",
  },
  fieldBlock: {
    display: "grid",
    gap: 6,
    marginTop: 12,
  },
  input: {
    border: "1px solid #d0d7de",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 4,
  },
};