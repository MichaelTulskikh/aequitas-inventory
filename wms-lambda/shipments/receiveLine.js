const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function receiveShipmentLine(event) {
    requireRole(event, ["[Staff]", "[Admin]"]);
    const shipmentId = event.requestContext.http.path.split("/")[2];
    const body = JSON.parse(event.body || "{}");

    const { item_id, location_id, quantity, unit, attributes } = body;

    if (!item_id || !location_id || !quantity) {
        return json(400, { error: "item_id, location_id, quantity required" });
    }

    const p = await getPool();
    await p.query("BEGIN");

    try {
        // 1) Find or create inventory lot
        const lot = await p.query(
            `SELECT id
         FROM inventory_lot
         WHERE item_id = $1
           AND location_id = $2
           AND attributes = $3
         FOR UPDATE`,
            [item_id, location_id, attributes || {}]
        );

        let lotId;

        if (lot.rowCount === 0) {
            const r = await p.query(
                `INSERT INTO inventory_lot (
             item_id, location_id, quantity, unit, attributes
           )
           VALUES ($1, $2, 0, $3, $4)
           RETURNING id`,
                [item_id, location_id, unit || "each", attributes || {}]
            );
            lotId = r.rows[0].id;
        } else {
            lotId = lot.rows[0].id;
        }

        // 2) Apply RECEIVE txn
        const snapshot = {
            source: "inbound_shipment",
            shipment_id: shipmentId
        };

        await p.query(
            `SELECT apply_inventory_txn(
           $1, 'RECEIVE', $2, $3,
           $4, NULL,
           'Inbound shipment',
           $5::jsonb
         )`,
            [
                lotId,
                quantity,
                unit || "each",
                shipmentId,
                JSON.stringify(snapshot)
            ]
        );

        await p.query("COMMIT");

        return json(200, { ok: true, inventory_lot_id: lotId });

    } catch (e) {
        await p.query("ROLLBACK");
        throw e;
    }
}

module.exports = { receiveShipmentLine }