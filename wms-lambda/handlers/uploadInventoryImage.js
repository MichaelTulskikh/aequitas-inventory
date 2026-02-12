const { getPool } = require("../db/pool");
const { requireRole } = require("../auth/requireRole");
const { json } = require("../http/response");
const { createPresignedUpload } = require("../storage/s3");

async function uploadInventoryImage(event) {
  requireRole(event, ["[Admin]", "[Staff]"]);

  const inventoryLotId = event.requestContext.http.path.split("/")[4];
  const { contentType, caption } = JSON.parse(event.body || "{}");

  if (!contentType) {
    return json(400, { error: "contentType required" });
  }

  const { uploadUrl, key } =
    await createPresignedUpload(inventoryLotId, contentType);

  const p = await getPool();

  await p.query(
    `
    INSERT INTO inventory_lot_image (
      inventory_lot_id,
      s3_key,
      caption
    )
    VALUES ($1, $2, $3)
    `,
    [inventoryLotId, key, caption || null]
  );

  return json(200, {
    uploadUrl,
    s3_key: key
  });
}

module.exports = { uploadInventoryImage };
