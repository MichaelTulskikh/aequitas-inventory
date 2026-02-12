const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function adminListRequests(event) {
  requireRole(event, ["[Admin]", "[Staff]"]);

  const status =
    event.queryStringParameters?.status || "submitted";

  const p = await getPool();

  const r = await p.query(
    `
    SELECT
      r.id,
      r.status,
      r.created_at,
      r.requester_user_sub,
      COUNT(rl.id) AS line_count,
      SUM(rl.quantity) AS total_items
    FROM request r
    LEFT JOIN request_line rl ON rl.request_id = r.id
    WHERE r.status = $1
    GROUP BY r.id
    ORDER BY r.created_at ASC
    `,
    [status]
  );

  return json(200, {
    items: r.rows,
  });
}

module.exports = { adminListRequests };
