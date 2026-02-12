import { useEffect, useState } from "react";
import "../styles/receive-inventory.css";
import {
  receiveInventory,
  requestImageUpload,
  uploadToS3,
} from "../api/inventory";
import LocationPicker from "./LocationPicker";
import { fetchInboundShipments, type Shipment } from "../api/shipments";
import AttributesEditor from "./AttributeEditor";
import ItemSearchPicker from "./ItemSearchPicker";
import type { Item } from "../api/items";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function ReceiveInventoryModal({ onClose, onSuccess }: Props) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [form, setForm] = useState({
    item_id: "",
    quantity: "",
    unit: "",
    attributes: {} as Record<string, any>,
    location_id: "",
    shipment_id: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    fetchInboundShipments().then((r) => setShipments(r.shipments));
  }, []);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img as any));
    };
  }, [images]);

  const removeImage = (index: number) => {
    setImages((imgs) => imgs.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!selectedItem) {
      setError("Please select an item");
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (!form.location_id) {
      setError("Please select a location");
      return;
    }
    if (!form.shipment_id) {
      setError("Please select a shipment");
      return;
    }
    if (!images.length) {
      setError("At least one image is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await receiveInventory({
        item_id: selectedItem.id,
        quantity: Number(form.quantity),
        unit: form.unit,
        location_id: form.location_id,
        shipment_id: form.shipment_id,
        attributes: form.attributes,
      });

      const lotId = res.inventory_lot_id;

      for (const file of images) {
        const upload = await requestImageUpload(lotId, file.type);
        await uploadToS3(upload.uploadUrl, file);
      }

      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to receive inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Receive Inventory</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {/* Item picker */}
        <div className="form-group">
          <label>Item</label>
          <ItemSearchPicker
            onSelect={(item) => {
              setSelectedItem(item);
              setForm((f) => ({
                ...f,
                item_id: item.id,
                unit: item.default_unit,
                attributes: { ...item.default_attributes },
              }));
            }}
          />
        </div>

        {/* Quantity + unit */}
        <div className="form-row">
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          

          <div className="form-group">
            <label>Unit</label>
            <input style={{backgroundColor: "#e1e2e2ff"}} value={selectedItem?.default_unit ?? ""} disabled />
          </div>
        </div>

        {/* Attributes */}
        <div className="form-group">
          <label>Attributes</label>
          <AttributesEditor
            value={form.attributes}
            onChange={(attrs) => setForm({ ...form, attributes: attrs })}
          />
        </div>

        {/* Location + shipment */}
        <div className="form-row">
          <div className="form-group">
            <label>Location</label>
            <LocationPicker
              value={form.location_id}
              onChange={(id) => setForm({ ...form, location_id: id })}
            />
          </div>

          <div className="form-group">
            <label>Shipment</label>
            <select
              value={form.shipment_id}
              onChange={(e) =>
                setForm({ ...form, shipment_id: e.target.value })
              }
            >
              <option value="">Select shipment</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipment_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Images */}
        <div className="form-group">
          <label>Images (required)</label>

          <div className="image-input-actions">
            <label className="image-button">
              Take photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) =>
                  setImages((imgs) => [...imgs, ...(e.target.files || [])])
                }
              />
            </label>

            <label className="image-button">
              Upload
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) =>
                  setImages((imgs) => [...imgs, ...(e.target.files || [])])
                }
              />
            </label>
          </div>
        </div>

        <div className="image-preview">
          {images.map((img, i) => (
            <div key={i} className="image-thumb">
              <img src={URL.createObjectURL(img)} alt="" />
              <button
                type="button"
                className="image-remove"
                onClick={() => removeImage(i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="app-button" disabled={loading} onClick={submit}>
            {loading ? "Saving…" : "Receive Inventory"}
          </button>
        </div>
      </div>
    </div>
  );
}
