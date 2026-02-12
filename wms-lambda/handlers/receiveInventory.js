const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function receiveInventory(event) {
  requireRole(event, ["[Admin]", "[Staff]"]);

  const {
    item_id,
    quantity,
    unit,
    location_id,
    shipment_id,
    attributes = {}
  } = JSON.parse(event.body || "{}");

  if (!item_id || !quantity || !location_id || !shipment_id) {
    return json(400, { error: "Missing required fields" });
  }

  const p = await getPool();
  await p.query("BEGIN");

  try {
    const lot = await p.query(
      `
      INSERT INTO inventory_lot (
        item_id,
        location_id,
        quantity,
        unit,
        attributes
      )
      VALUES ($1, $2, 0, $3, $4::jsonb)
      RETURNING id
      `,
      [item_id, location_id, unit || "each", attributes]
    );

    const lotId = lot.rows[0].id;

    await p.query(
      `
      SELECT apply_inventory_txn(
        $1,
        'RECEIVE',
        $2,
        $3,
        $4,
        NULL,
        'Manual receive'
      )
      `,
      [lotId, quantity, unit || "each", shipment_id]
    );

    await p.query("COMMIT");

    return json(200, {
      ok: true,
      inventory_lot_id: lotId
    });

  } catch (e) {
    await p.query("ROLLBACK");
    throw e;
  }
}

module.exports = { receiveInventory };
