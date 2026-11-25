const { getStore } = require("@netlify/blobs");
const { randomUUID } = require("crypto");

const ADMIN_PASS = process.env.ADMIN_PASS || "enheetulgaa123";
const KEY_TTL_MS = 24 * 60 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, body: "Bad JSON" }; }

  if (body.password !== ADMIN_PASS)
    return { statusCode: 401, body: JSON.stringify({ error: "Wrong password" }) };

  const count = Math.min(parseInt(body.count) || 1, 100);
  const store = getStore("keys");
  const generated = [];

  for (let i = 0; i < count; i++) {
    const key = randomUUID();
    await store.setJSON(key, {
      key,
      createdAt: Date.now(),
      expiresAt: Date.now() + KEY_TTL_MS,
    });
    generated.push(key);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generated }),
  };
};
