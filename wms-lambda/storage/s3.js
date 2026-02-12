const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const BUCKET = process.env.INVENTORY_BUCKET;

const s3 = new S3Client({});

async function createPresignedUpload(inventoryLotId, contentType) {
  const key = `inventory/lots/${inventoryLotId}/${uuidv4()}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return { uploadUrl, key };
}

module.exports = { createPresignedUpload };
