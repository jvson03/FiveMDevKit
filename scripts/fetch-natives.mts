// scripts/fetch-natives.mts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Setup process-wide error handlers for better logging.
process.on("uncaughtException", (err: unknown) => {
  if (err instanceof Error) {
    console.error("Uncaught Exception:", err.stack);
  } else {
    console.error("Uncaught Exception:", err);
  }
});

process.on("unhandledRejection", (reason: unknown) => {
  if (reason instanceof Error) {
    console.error("Unhandled Rejection:", reason.stack);
  } else {
    console.error("Unhandled Rejection:", reason);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NATIVES_URL = "https://runtime.fivem.net/doc/natives.json";
const outputDir = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(outputDir, "natives.json");

async function fetchNatives() {
  console.log("Starting fetch script.");
  try {
    console.log("Importing node-fetch dynamically...");
    const { default: fetch } = await import("node-fetch");
    console.log("node-fetch imported successfully.");

    console.log(`Fetching FiveM natives from ${NATIVES_URL} ...`);
    const response = await fetch(NATIVES_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch. Status: ${response.status}`);
    }
    const data = await response.json();

    if (!fs.existsSync(outputDir)) {
      console.log(`Output directory ${outputDir} does not exist. Creating...`);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Natives saved to ${OUTPUT_FILE}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error in fetchNatives:", err.stack);
    } else {
      console.error("Error in fetchNatives:", JSON.stringify(err, null, 2));
    }
    throw err;
  }
}

fetchNatives().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error("Error fetching natives:", err.stack);
  } else {
    console.error("Error fetching natives:", JSON.stringify(err, null, 2));
  }
  process.exit(1);
});
