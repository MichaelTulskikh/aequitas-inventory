const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function getRequests(event) {
    const user_sub = requireRole(event, ["[Viewer]", "[Staff]", "[Admin]"]).sub;
    const p = await getPool();

    const findSql = `
      SELECT *
      FROM request
      WHERE requester_user_sub = $1
        AND status = 'draft'
      LIMIT 1
    `;

    const r = await p.query(findSql, [user_sub]);

    if (r.rows.length > 0) {
        return json(200, { items: r.rows });
    }

    const create_request_sql = `INSERT INTO request (requester_user_sub) VALUES ($1) RETURNING *;`
    const create_request_r = await p.query(create_request_sql, [user_sub]);
    const request_id = create_request_r.rows[0].id;
    return json(200, {
        "user_id": user_sub,
        "request_id": request_id,
        "status": "draft",
    })

}

module.exports = { getRequests }