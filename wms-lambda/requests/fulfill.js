const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function fulfillRequest(event) {
    const user = requireRole(event, ["[Staff]", "[Admin]"]);
    const requestId = event.requestContext.http.path.split("/")[2];

    const p = await getPool();
    await p.query("BEGIN");

    try {
        // 1) Lock request
        const req = await p.query(
            `SELECT id, status, requester_user_sub
         FROM request
         WHERE id = $1
         FOR UPDATE`,
            [requestId]
        );

        if (req.rowCount === 0) {
            throw { statusCode: 404, message: "Request not found" };
        }
        if (req.rows[0].status !== "submitted") {
            throw { statusCode: 400, message: "Request not submitted" };
        }

        // 2) Create outbound shipment
        const shipment = await p.query(
            `INSERT INTO shipment (
           direction,
           shipment_number,
           status,
           notes
         )
         VALUES (
           'OUT',
           $1,
           'completed',
           'Fulfilled from request'
         )
         RETURNING id`,
            [`REQ-${requestId.slice(0, 8)}`]
        );

        const shipmentId = shipment.rows[0].id;

        // 3) Fetch request lines
        const lines = await p.query(
            `SELECT
           rl.id,
           rl.inventory_lot_id,
           rl.quantity,
           rl.unit,
           i.name AS item_name,
           l.attributes
         FROM request_line rl
         JOIN inventory_lot l ON l.id = rl.inventory_lot_id
         JOIN item i ON i.id = l.item_id
         WHERE rl.request_id = $1
           AND rl.status = 'reserved'
         FOR UPDATE`,
            [requestId]
        );

        // 4) Apply inventory transactions
        for (const line of lines.rows) {
            const snapshot = {
                source: "request_fulfillment",
                request_id: requestId,
                item: line.item_name,
                attributes: line.attributes
            };

            await p.query(
                `SELECT apply_inventory_txn(
             $1, 'DISTRIBUTE', $2, $3,
             $4, NULL,
             'Request fulfillment',
             $5::jsonb
           )`,
                [
                    line.inventory_lot_id,
                    -line.quantity,
                    line.unit,
                    shipmentId,
                    JSON.stringify(snapshot)
                ]
            );

            await p.query(
                `UPDATE request_line
           SET status = 'fulfilled'
           WHERE id = $1`,
                [line.id]
            );
        }

        // 5) Mark request fulfilled
        await p.query(
            `UPDATE request
         SET status = 'fulfilled'
         WHERE id = $1`,
            [requestId]
        );

        await p.query("COMMIT");

        return json(200, {
            ok: true,
            shipment_id: shipmentId,
            fulfilled_lines: lines.rowCount
        });

    } catch (e) {
        await p.query("ROLLBACK");
        throw e;
    }
}

module.exports = { fulfillRequest };