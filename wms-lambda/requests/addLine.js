const { getPool } = require("../db/pool");
const { getPathParam } = require("../http/request");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function addRequestLine(event) {
    const user = requireRole(event, ["[Viewer]", "[Staff]", "[Admin]"]);
    const requestId = getPathParam(event.requestContext.http.path, 2);
    const { inventory_lot_id, quantity } = parseJsonBody(event);

    if (!inventory_lot_id || !quantity || quantity <= 0) {
        return json(400, { error: "inventory_lot_id and positive quantity required" });
    }

    const p = await getPool();
    await p.query("BEGIN");

    try {
        // 1) Ensure request exists and belongs to user and is draft
        const req = await p.query(
            `SELECT id, status
         FROM request
         WHERE id = $1 AND requester_user_sub = $2
         FOR UPDATE`,
            [requestId, user.sub]
        );

        if (req.rowCount === 0) {
            throw { statusCode: 404, message: "Request not found" };
        }
        if (req.rows[0].status !== "draft") {
            throw { statusCode: 400, message: "Request is not editable" };
        }

        // 2) Lock inventory lot
        const lot = await p.query(
            `SELECT quantity
         FROM inventory_lot
         WHERE id = $1
         FOR UPDATE`,
            [inventory_lot_id]
        );

        if (lot.rowCount === 0) {
            throw { statusCode: 404, message: "Inventory lot not found" };
        }

        const onHand = Number(lot.rows[0].quantity);

        // 3) Compute reserved
        const res = await p.query(
            `SELECT COALESCE(SUM(quantity), 0) AS reserved
         FROM request_line
         WHERE inventory_lot_id = $1
           AND status = 'reserved'`,
            [inventory_lot_id]
        );

        const reserved = Number(res.rows[0].reserved);
        const available = onHand - reserved;

        // 4) Validate availability
        if (quantity > available) {
            throw {
                statusCode: 409,
                message: `Only ${available} available`
            };
        }

        // 5) Insert reservation
        const line = await p.query(
            `INSERT INTO request_line (
           request_id,
           inventory_lot_id,
           quantity,
           unit
         )
         VALUES ($1, $2, $3, 'each')
         RETURNING id`,
            [requestId, inventory_lot_id, quantity]
        );

        await p.query("COMMIT");

        return json(200, {
            ok: true,
            request_line_id: line.rows[0].id,
            reserved: quantity
        });
    } catch (e) {
        await p.query("ROLLBACK");
        throw e;
    }
}

module.exports = { addRequestLine }