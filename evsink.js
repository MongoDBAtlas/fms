import { fmscol as co } from "./mongocli.js";

let lastStatus = {};

export function statusSink(ste) {
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
    kinematicSink(kid);
  }
}

export function kinematicSink(kie) {
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
}
