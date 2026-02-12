const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");
const { getPathParam } = require("../http/request");

async function submitRequest(event) {
    const user = requireRole(event, ["[Viewer]", "[Staff]", "[Admin]"]);
    const requestId = getPathParam(event.requestContext.http.path, 2);

    const p = await getPool();
    await p.query("BEGIN");

    try {
        const r = await p.query(
            `SELECT status
         FROM request
         WHERE id = $1 AND requester_user_sub = $2
         FOR UPDATE`,
            [requestId, user.sub]
        );

        if (r.rowCount === 0) {
            throw { statusCode: 404, message: "Request not found" };
        }
        if (r.rows[0].status !== "draft") {
            throw { statusCode: 400, message: "Request already submitted" };
        }

        await p.query(
            `UPDATE request
         SET status = 'submitted'
         WHERE id = $1`,
            [requestId]
        );

        await p.query("COMMIT");

        return json(200, { ok: true, status: "submitted" });
    } catch (e) {
        await p.query("ROLLBACK");
        throw e;
    }
}

module.exports = {
    submitRequest
}