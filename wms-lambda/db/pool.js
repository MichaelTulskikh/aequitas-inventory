const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { Pool } = require("pg");

let pool = null;
let cachedSecret = null;

async function getDbConfig() {
    if (cachedSecret) return cachedSecret;

    const secretName = process.env.DB_SECRET_NAME;
    if (!secretName) throw new Error("Missing env var DB_SECRET_NAME");

    const client = new SecretsManagerClient({});
    const resp = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
    const secretString = resp.SecretString || "{}";
    const s = JSON.parse(secretString);
    console.log(s)

    const required = ["username", "password"];
    for (const k of required) {
        if (s[k] === undefined || s[k] === null || s[k] === "") {
            throw new Error(`Secret missing key: ${k}`);
        }
    }

    cachedSecret = {
        host: process.env.host,
        port: Number(process.env.port),
        database: process.env.name,
        user: s.username,
        password: s.password,
        ssl: { rejectUnauthorized: false } // RDS typically requires SSL; keep simple for now
    };

    return cachedSecret;
}

async function getPool() {
    if (pool) return pool;
    const cfg = await getDbConfig();
    pool = new Pool({
        ...cfg,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
    return pool;
}

module.exports = { getPool };