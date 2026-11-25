const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS")
    return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Method Not Allowed" };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ valid: false }) }; }

  const { key } = body;
  if (!key)
    return { statusCode: 400, headers, body: JSON.stringify({ valid: false, error: "No key" }) };

  const store = getStore("keys");
  let record;
  try { record = await store.get(key, { type: "json" }); }
  catch { record = null; }

  if (!record)
    return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: "Key not found" }) };

  if (Date.now() > record.expiresAt) {
    await store.delete(key);
    return { statusCode: 200, headers, body: JSON.stringify({ valid: false, error: "Key expired" }) };
  }

  const remainingHours = ((record.expiresAt - Date.now()) / 3600000).toFixed(1);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ valid: true, remainingHours, expiresAt: record.expiresAt }),
  };
};
