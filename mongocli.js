import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// prerequisite: cli_init
let fmscol;

async function cli_init(bBig, bClean) {
  dotenv.config();
  const connURI = process.env.ATLAS_CONN_URI ?? "";
  const DB = bBig ? "fms10k" : "fmsk";
  const CO = "kinematic_info";

  const cli = new MongoClient(connURI);
  await cli.connect();
  const db = cli.db(DB);

  const cols = await db.collections();
  let bExists = cols.some((col) => col.s.namespace.collection === CO);
  if (bExists && bClean) {
    console.log(`+++ reset collection: "${DB}.${CO}"`);
    await db.collection(CO).drop();
    bExists = false;
  }

  if (bExists) {
    console.log(`+++ collection exists: "${DB}.${CO}"`);
    fmscol = db.collection(CO);
  } else {
    console.log(`+++ create collection: "${DB}.${CO}"`);
    const col = await cli.db(DB).createCollection(CO, {
      timeseries: {
        timeField: "timestamp_iso",
        metaField: "fleet_intg_id",
        granularity: "seconds",
      },
    });
    fmscol = col;
  }
}

export { fmscol, cli_init };
