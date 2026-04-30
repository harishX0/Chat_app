const dns = require("dns");
const mongoose = require("mongoose");

const DEFAULT_DB_NAME = "userDB";
const DNS_ERROR_CODES = new Set(["ECONNREFUSED", "ENODATA", "ENOTFOUND", "ESERVFAIL", "ETIMEOUT"]);

let dnsConfigured = false;
let retryTimer = null;

function getEnvNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getConfiguredDbName() {
  return (process.env.MONGO_DB_NAME || DEFAULT_DB_NAME).trim();
}

function getMongooseOptions() {
  const options = {
    connectTimeoutMS: getEnvNumber("MONGO_CONNECT_TIMEOUT_MS", 10000),
    serverSelectionTimeoutMS: getEnvNumber("MONGO_SERVER_SELECTION_TIMEOUT_MS", 10000),
  };

  if (process.env.MONGO_AUTH_SOURCE) {
    options.authSource = process.env.MONGO_AUTH_SOURCE;
  }

  return options;
}

function normalizeMongoUri(rawUri) {
  const uri = (rawUri || "").trim();
  if (!uri) {
    return uri;
  }

  const dbName = getConfiguredDbName();
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/?#]+)(?:\/([^?#]*))?(\?[^#]*)?(#.*)?$/i);

  if (!dbName || !match) {
    return uri;
  }

  const [, baseUri, path = "", query = "", hash = ""] = match;

  if (path) {
    return uri;
  }

  return `${baseUri}/${encodeURIComponent(dbName)}${query}${hash}`;
}

function configureMongoDns() {
  if (dnsConfigured) {
    return;
  }

  const servers = (process.env.MONGO_DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (!servers.length) {
    return;
  }

  dns.setServers(servers);
  dnsConfigured = true;
  console.log(`MongoDB DNS servers: ${servers.join(", ")}`);
}

function isSrvDnsError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  return (
    message.includes("_mongodb._tcp") ||
    message.includes("querySrv") ||
    (DNS_ERROR_CODES.has(code) && /srv|dns|mongodb\.net/i.test(message))
  );
}

function isAuthError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  return code === "8000" || /bad auth|authentication failed/i.test(message);
}

function logConnectionHelp(error) {
  if (isAuthError(error)) {
    console.error(
      [
        "MongoDB Atlas accepted the network connection but rejected the credentials.",
        "Reset the database user's password in Atlas Database Access, confirm the username, and URL-encode any special characters in the password.",
      ].join(" ")
    );
    return;
  }

  if (!isSrvDnsError(error)) {
    return;
  }

  console.error(
    [
      "MongoDB Atlas SRV DNS lookup failed.",
      "The app can use MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1 to bypass a resolver that refuses SRV records.",
      "If it still fails, copy the non-SRV connection string from Atlas and use it as MONGO_URI.",
    ].join(" ")
  );
}

async function seedDbOnce() {
  if (process.env.MONGO_SEED_ON_START !== "true") {
    return;
  }

  await mongoose.connection.db.collection("connection_tests").updateOne(
    { _id: "startup" },
    {
      $set: { checkedAt: new Date() },
      $setOnInsert: {
        createdAt: new Date(),
        source: "backend startup",
      },
    },
    { upsert: true }
  );

  console.log("MongoDB startup seed verified: connection_tests.startup");
}

const connectDB = async ({ retry = true } = {}) => {
  try {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    configureMongoDns();

    const uri = normalizeMongoUri(process.env.MONGO_URI);
    if (!uri) {
      throw new Error("MONGO_URI is missing. Set it in backend/.env");
    }

    const connection = await mongoose.connect(uri, getMongooseOptions());

    console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    await seedDbOnce();
    return connection;
  } catch (error) {
    const code = error?.code ? ` (${error.code})` : "";
    console.error(`MongoDB connection error: ${error?.name || "Error"}${code}: ${error.message}`);
    logConnectionHelp(error);

    if (!retry) {
      throw error;
    }

    const retryMs = getEnvNumber("MONGO_RETRY_MS", 5000);
    console.error(`Retrying MongoDB connection in ${Math.round(retryMs / 1000)} seconds...`);
    retryTimer = setTimeout(() => {
      connectDB();
    }, retryMs);

    return null;
  }
};

module.exports = connectDB;
module.exports.normalizeMongoUri = normalizeMongoUri;
module.exports.configureMongoDns = configureMongoDns;
module.exports.isSrvDnsError = isSrvDnsError;
module.exports.isAuthError = isAuthError;
