const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("../config/db");

dotenv.config();

async function main() {
  try {
    const connection = await connectDB({ retry: false });
    console.log(`MongoDB check passed: ${connection.connection.host}/${connection.connection.name}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`MongoDB check failed: ${error.message}`);
  process.exitCode = 1;
});
