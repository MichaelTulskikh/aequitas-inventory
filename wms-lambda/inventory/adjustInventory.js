const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

// Adjustments Logic
async function adjustInventoryLot(event) {
    requireRole(event, ["[Staff]", "[Admin]"]);

    const lotId = event.requestContext.http.path.split("/")[2];
    const body = JSON.parse(event.body || "{}");

    const { delta, reason } = body;

    if (typeof delta !== "number" || delta === 0) {
        return json(400, { error: "delta must be a non-zero number" });
    }

    const p = await getPool();
    await p.query("BEGIN");

    try {
        // Fetch context for snapshot
        const ctx = await p.query(
            `SELECT
           i.name AS item_name,
           l.attributes,
           loc.name AS location_name
         FROM inventory_lot l
         JOIN item i ON i.id = l.item_id
         JOIN location loc ON loc.id = l.location_id
         WHERE l.id = $1
         FOR UPDATE`,
            [lotId]
        );

        if (ctx.rowCount === 0) {
            throw { statusCode: 404, message: "Inventory lot not found" };
        }

        const snapshot = {
            source: "manual_adjustment",
            item: ctx.rows[0].item_name,
            location: ctx.rows[0].location_name,
            attributes: ctx.rows[0].attributes,
            delta,
            reason
        };

        await p.query(
            `SELECT apply_inventory_txn(
           $1,
           'CORRECTION',
           $2,
           'each',
           NULL,
           NULL,
           $3,
           $4::jsonb
         )`,
            [
                lotId,
                delta,
                reason || "Manual adjustment",
                JSON.stringify(snapshot)
            ]
        );

        await p.query("COMMIT");

        return json(200, {
            ok: true,
            inventory_lot_id: lotId,
            delta
        });

    } catch (e) {
        await p.query("ROLLBACK");
        throw e;
    }
}

module.exports = { adjustInventoryLot }