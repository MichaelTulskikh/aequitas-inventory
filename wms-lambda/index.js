const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { Pool } = require("pg");
const { getPool } = require("./db/pool");
const { json } = require("./http/response");
const { getRequests } = require("./requests/getOrCreate");
const { addRequestLine } = require("./requests/addLine");
const { listInventory } = require("./inventory/listInventory");
const { getRequestById } = require("./requests/getById");
const { submitRequest } = require("./requests/submit");
const { fulfillRequest } = require("./requests/fulfill");
const { createInboundShipment } = require("./shipments/createInbound");
const { receiveShipmentLine } = require("./shipments/receiveLine");
const { adjustInventoryLot } = require("./inventory/adjustInventory");
const { adminGetRequestById } = require('./requests/adminGetRequestById');
const { adminListRequests } = require('./requests/adminListRequests');
const { receiveInventory } = require('./handlers/receiveInventory');
const { inventoryTemplates } = require('./handlers/inventoryTemplates');
const { uploadInventoryImage } = require('./handlers/uploadInventoryImage');

exports.handler = async (event) => {

  try {
    const method = event.requestContext?.http?.method || event.httpMethod || "GET";
    const path = event.requestContext?.http?.path || event.path || "/";

    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://d2ma7m4rhtxjvb.cloudfront.net",
          "Access-Control-Allow-Headers": "Authorization,Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        body: "",
      };
    }
  
    if (method === "GET" && path === "/api/health") {
      const p = await getPool();
      const r = await p.query("SELECT current_database() AS db");
      return json(200, { ok: true, db: r.rows[0].db });
    }

    if (method === "GET" && path === "/api/inventory") {
      return await listInventory(event);
    }

    if (method === "POST" && path === "/api/seed/basic") {
      const res = await ensureBasicSeed();
      return json(200, res);
    }

    if (method === "POST" && path === "/api/requests") {
      return await getRequests(event);
    }

    if (method === "POST" && path.match(/^\/api\/requests\/[^/]+\/lines$/)) {
      return await addRequestLine(event);
    }
    
    if (method === "GET" && path.match(/^\/api\/requests\/[^/]+$/)) {
      return await getRequestById(event);
    }
    
    if (method === "POST" && path.match(/^\/api\/requests\/[^/]+\/submit$/)) {
      return await submitRequest(event);
    }

    if (method === "POST" && path.match(/^\/api\/requests\/[^/]+\/fulfill$/)) {
      return await fulfillRequest(event);
    }    

    if (method === "POST" && path === "/api/shipments") {
      return await createInboundShipment(event);
    }
    
    if (method === "POST" && path.match(/^\/api\/shipments\/[^/]+\/receive$/)) {
      return await receiveShipmentLine(event);
    }

    if (method === "POST" && path.match(/^\/api\/inventory-lots\/[^/]+\/adjust$/)) {
      return await adjustInventoryLot(event);
    }

    if (method === "GET" && path === "/api/admin/requests") {
      return await adminListRequests(event);
    }
    
    if (method === "GET" && path.match(/^\/api\/admin\/requests\/[^/]+$/)) {
      return await adminGetRequestById(event);
    }
    // Inventory Uploads
    if (method === "GET" && path === "/api/inventory/templates") {
      return await inventoryTemplates(event);
    }
    
    if (method === "POST" && path === "/api/inventory/receive") {
      return await receiveInventory(event);
    }
    
    if (method === "POST" && path.match(/^\/api\/inventory\/lots\/[^/]+\/images$/)) {
      return await uploadInventoryImage(event);
    }
    
    

    return json(404, { error: "Not found", method, path });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Server error", message: String(e.message || e) });
  }
};
