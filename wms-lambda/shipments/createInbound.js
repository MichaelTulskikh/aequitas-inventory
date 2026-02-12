const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function createInboundShipment(event) {
    requireRole(event, ["[Staff]", "[Admin]"]);
    const body = JSON.parse(event.body || "{}");

    if (!body.shipment_number) {
        return json(400, { error: "shipment_number required" });
    }

    const p = await getPool();

    const r = await p.query(
        `INSERT INTO shipment (
         direction,
         shipment_number,
         partner_id,
         status,
         notes
       )
       VALUES ('IN', $1, $2, 'draft', $3)
       RETURNING id`,
        [body.shipment_number, body.partner_id || null, body.notes || null]
    );

    return json(200, { shipment_id: r.rows[0].id });
}


module.exports = { createInboundShipment };