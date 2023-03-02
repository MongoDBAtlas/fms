import { fmscol } from "./mongocli.js";

const wbuf = [];
async function kinematic_handler(kid) {
  const blen = wbuf.push(kid);
  if (blen === 60 || kid.status.engine === "OFF") {
    const res = await fmscol.insertMany(wbuf, { ordered: false });
    wbuf.length = 0;
    return res;
  } else {
    return {
      acknowledged: false,
      insertedCount: 0,
    };
  }
}

let lastStatus = {};

export async function statusSink(ste) {
  let std = (({
    command_id,
    command_result,
    command,
    object,
    type,
    message_at,
    //
    customer_id,
    fleet_intg_id,
    vin,
    ...std
  }) => std)(ste);

  lastStatus[ste.fleet_intg_id] = std;

  if (std.engine === "OFF") {
    let kid = {
      customer_id: ste.customer_id,
      fleet_intg_id: ste.fleet_intg_id,
      vin: ste.vin,
      timestamp_iso: std.timestamp_iso,
      status: std,
    };
    await kinematicSink(kid);
  }
}

export async function kinematicSink(kie) {
  let kid = (({
    command_id,
    command_result,
    command,
    object,
    type,
    message_at,
    ...kid
  }) => kid)(kie);

  kid["status"] = lastStatus[kid.fleet_intg_id];
  const res = await kinematic_handler(kid);
  if (res.acknowledged) {
    console.log("---- inserted:", res.insertedCount);
  }
}
