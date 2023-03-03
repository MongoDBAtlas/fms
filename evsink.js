import { fmscol } from "./mongocli.js";

const wbuf = [];
async function kinematic_handler(kid) {
  const blen = wbuf.push(kid);
  if (blen === 100000) {
    const res = await fmscol.insertMany(wbuf, {
      writeConcern: { w: 1 },
      ordered: false,
    });
    wbuf.length = 0;
    return res;
  } else {
    return {
      acknowledged: false,
      insertedCount: 0,
    };
  }
}

export async function flush_source() {
  if (wbuf.length > 0) {
    const res = await fmscol.insertMany(wbuf, {
      writeConcern: { w: 1 },
      ordered: false,
    });
    wbuf.length = 0;
    console.log(inc().zeroPad(10000) + "  flushed:", res.insertedCount);
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
    let kie = {
      customer_id: ste.customer_id,
      fleet_intg_id: ste.fleet_intg_id,
      vin: ste.vin,
      timestamp_iso: std.timestamp_iso,
      status: std,
    };
    await kinematicSink(kie);
  }
}

let inc = (function (iv) {
  let i = iv;
  return function () {
    return ++i;
  };
})(0);

export async function kinematicSink(kie) {
  let kid = (({
    command_id,
    command_result,
    command,
    object,
    type,
    message_at,
    customer_id,
    fleet_intg_id,
    ...kid
  }) => kid)(kie);

  kid["status"] = lastStatus[kie.fleet_intg_id];
  kid["vehicle"] = {
    customer_id: kie.customer_id,
    fleet_intg_id: kie.fleet_intg_id,
  };
  const res = await kinematic_handler(kid);
  if (res.acknowledged) {
    console.log(inc().zeroPad(10000) + " inserted:", res.insertedCount);
  }
}
