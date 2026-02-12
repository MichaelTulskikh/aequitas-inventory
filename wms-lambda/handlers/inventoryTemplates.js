const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");

async function inventoryTemplates(event) {
  requireRole(event, ["[Admin]", "[Staff]"]);

  const p = await getPool();

  const r = await p.query(`
    SELECT DISTINCT ON (i.id)
      i.id AS item_id,
      i.name AS item_name,
      i.default_unit,
      l.attributes
    FROM inventory_lot l
    JOIN item i ON i.id = l.item_id
    ORDER BY i.id, l.created_at DESC
  `);

  return json(200, { items: r.rows });
}

module.exports = { inventoryTemplates };
