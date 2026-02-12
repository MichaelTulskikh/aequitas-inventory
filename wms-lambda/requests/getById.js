const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");
const { getPathParam } = require("../http/request");

async function getRequestById(event) {
    const user = requireRole(event, ["[Viewer]", "[Staff]", "[Admin]"]);
    const requestId = getPathParam(event.requestContext.http.path);

    const p = await getPool();

    const header = await p.query(
        `SELECT id, status, created_at
       FROM request
       WHERE id = $1 AND requester_user_sub = $2`,
        [requestId, user.sub]
    );

    if (header.rowCount === 0) {
        return json(404, { error: "Request not found" });
    }

    const lines = await p.query(
        `SELECT
         rl.id,
         rl.quantity,
         rl.unit,
         rl.status,
         i.name AS item_name,
         loc.name AS location_name
       FROM request_line rl
       JOIN inventory_lot l ON l.id = rl.inventory_lot_id
       JOIN item i ON i.id = l.item_id
       JOIN location loc ON loc.id = l.location_id
       WHERE rl.request_id = $1
       ORDER BY i.name`,
        [requestId]
    );

    return json(200, {
        request: header.rows[0],
        lines: lines.rows
    });
}

module.exports = { getRequestById };