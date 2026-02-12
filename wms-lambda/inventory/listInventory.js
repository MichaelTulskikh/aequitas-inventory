const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");
const { getQueryParam } = require("../http/request");

async function listInventory(event) {
    requireRole(event, ["[Admin]", "[Staff]", "[Viewer]"]);
    const p = await getPool();

    /* -----------------------------
       Helpers
    ----------------------------- */

    const parseList = (key, { lower = false } = {}) => {
        const v = getQueryParam(event, key);
        if (!v) return undefined;

        const arr = v
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        if (!arr.length) return undefined;
        return lower ? arr.map(s => s.toLowerCase()) : arr;
    };

    const parseOptionalNumber = (key) => {
        const v = getQueryParam(event, key);
        if (v === null || v === undefined || v === "") return undefined;

        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    };

    const addPrefix = (list, prefix) => {
        if (!Array.isArray(list)) return undefined;

        return list
            .map(String)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => `${prefix} ${s}`);
    }

    /* -----------------------------
       Query params
    ----------------------------- */

    const q = getQueryParam(event, "q")?.trim().toLowerCase();

    const types = parseList("types", { lower: true });
    const pallets = addPrefix(parseList("pallets", { lower: true }), "pallet");
    const boxes = addPrefix(parseList("boxes", { lower: true }), "box");

    console.log(types, pallets, boxes)

    const minOnHand = parseOptionalNumber("min_on_hand");
    const maxOnHand = parseOptionalNumber("max_on_hand");
    const minAvailable = parseOptionalNumber("min_available");
    const maxAvailable = parseOptionalNumber("max_available");

    const limitRaw = parseOptionalNumber("limit");
    const limit = limitRaw && limitRaw > 0 ? Math.min(limitRaw, 500) : 100;

    const pageRaw = parseOptionalNumber("page");
    const pageSizeRaw = parseOptionalNumber("page_size");

    const page = pageRaw && pageRaw > 0 ? pageRaw : 1;
    const pageSize = pageSizeRaw && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 500) : 50;
    const offset = (page - 1) * pageSize;

    /* -----------------------------
       SQL builders
    ----------------------------- */

    const params = [];
    const where = [];
    const having = [];

    if (q) {
        params.push(`%${q}%`);
        where.push(`LOWER(i.name) LIKE $${params.length}`);
    }

    if (types) {
        params.push(types);
        where.push(`LOWER(it.name) = ANY($${params.length})`);
    }

    if (boxes) {
        params.push(boxes);
        where.push(`LOWER(loc.name) = ANY($${params.length})`);
    }

    if (pallets) {
        params.push(pallets);
        where.push(`LOWER(parent.name) = ANY($${params.length})`);
    }

    if (minOnHand !== undefined) {
        params.push(minOnHand);
        having.push(`l.quantity >= $${params.length}`);
    }

    if (maxOnHand !== undefined) {
        params.push(maxOnHand);
        having.push(`l.quantity <= $${params.length}`);
    }

    if (minAvailable !== undefined) {
        params.push(minAvailable);
        having.push(`
        l.quantity -
        COALESCE(SUM(rl.quantity) FILTER (WHERE rl.status = 'reserved'), 0)
        >= $${params.length}
      `);
    }

    if (maxAvailable !== undefined) {
        params.push(maxAvailable);
        having.push(`
        l.quantity -
        COALESCE(SUM(rl.quantity) FILTER (WHERE rl.status = 'reserved'), 0)
        <= $${params.length}
      `);
    }

    const filterParams = [...params];

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const havingSql = having.length ? `HAVING ${having.join(" AND ")}` : "";

    const countSql = `
        SELECT COUNT(*)::int AS total
        FROM (
            SELECT l.id
            FROM inventory_lot l
            JOIN item i ON i.id = l.item_id
            JOIN item_type it ON it.id = i.item_type_id
            JOIN location loc ON loc.id = l.location_id
            LEFT JOIN location parent ON parent.id = loc.parent_location_id
            LEFT JOIN request_line rl ON rl.inventory_lot_id = l.id
            ${whereSql}
            GROUP BY l.id, l.quantity
            ${havingSql}
        ) t
    `;


    /* -----------------------------
       Final SQL
    ----------------------------- */

    params.push(limit);
    params.push(pageSize);
    params.push(offset);

    const sql = `
      SELECT
        l.id AS lot_id,
        i.name AS item_name,
        it.name AS item_type,
  
        l.quantity AS on_hand,
  
        COALESCE(
          SUM(rl.quantity) FILTER (WHERE rl.status = 'reserved'),
          0
        ) AS reserved,
  
        l.quantity -
        COALESCE(
          SUM(rl.quantity) FILTER (WHERE rl.status = 'reserved'),
          0
        ) AS available,
  
        l.unit,
        l.attributes,
  
        loc.name AS box_name,
        parent.name AS pallet_name,
        grand.name AS warehouse_name,
  
        (
          SELECT img.s3_key
          FROM inventory_lot_image img
          WHERE img.inventory_lot_id = l.id
          ORDER BY img.created_at DESC
          LIMIT 1
        ) AS image_s3_key
  
      FROM inventory_lot l
      JOIN item i ON i.id = l.item_id
      JOIN item_type it ON it.id = i.item_type_id
      JOIN location loc ON loc.id = l.location_id
      LEFT JOIN location parent ON parent.id = loc.parent_location_id
      LEFT JOIN location grand ON grand.id = parent.parent_location_id
      LEFT JOIN request_line rl ON rl.inventory_lot_id = l.id
  
      ${whereSql}
  
      GROUP BY
        l.id, i.name, it.name, l.quantity, l.unit, l.attributes,
        loc.name, parent.name, grand.name
  
      ${havingSql}
  
      ORDER BY it.name, i.name
      LIMIT $${filterParams.length + 1}
      OFFSET $${filterParams.length + 2};
    `;

    /* -----------------------------
       Execute
    ----------------------------- */

    // const r = await p.query(sql, params);
    const totalRes = await p.query(countSql, filterParams);

    const dataParams = [
        ...filterParams, 
        pageSize, 
        offset
    ];

    const dataRes = await p.query(sql, dataParams);

    // return json(200, { items: r.rows });
    return json(200, {
        items: dataRes.rows,
        page,
        page_size: pageSize,
        total: totalRes.rows[0].total
    });
}

module.exports = { listInventory };