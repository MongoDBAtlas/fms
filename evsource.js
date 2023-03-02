import mgen from "mgeneratejs";
import { status_template, kinematic_template } from "./template.js";
import nopt from "nopt";
import { statusSink, kinematicSink } from "./evsink.js";
import { cli_init } from "./mongocli.js";

function gen_vins(nVins) {
  const vinseed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  let vins = new Array(nVins);
  let vin;
  for (let i = 0; i < nVins; i++) {
    vin = mgen({
      vin: {
        $pickset: {
          array: vinseed.split(""),
          quantity: 17,
        },
      },
    });
    vins[i] = vin.vin.join("");
  }

  return vins;
}

let kinematic_start, kinematic_end;
async function gen_kinematic_info(evStatus) {
  let evsec = evStatus.timestamp_iso.getTime();
  let round_end = evsec + 60 * 1000;
  if (round_end <= kinematic_start) return;
  if (evsec < kinematic_start) evsec = kinematic_start;

  let template = {
    ...kinematic_template,
    customer_id: evStatus.customer_id,
    fleet_intg_id: evStatus.fleet_intg_id,
    vin: evStatus.vin,
  };
  let kme;

  while (evsec < round_end) {
    kme = mgen(template);
    kme.timestamp_iso = new Date(evsec);
    kme.accmag.x = kme.accmag.x.map((v) => v / 10);
    kme.accmag.y = kme.accmag.y.map((v) => v / 10);
    kme.accmag.z = kme.accmag.z.map((v) => v / 10);
    await kinematicSink(kme);

    evsec = evsec + 1000;
    if (evsec >= kinematic_end) break;
  }
}

async function gen_vehical_status(vin, customer_id, fleet_id, lasttime) {
  let running_min = 3; // TODO; fix time
  let template = {
    ...status_template,
    customer_id: customer_id,
    fleet_intg_id: fleet_id,
    vin: vin,
  };

  let ste;
  lasttime = lasttime.getTime();
  kinematic_start = lasttime + Math.random() * 60 * 1000 + 30 * 1000;
  kinematic_end =
    lasttime + (running_min - 1) * 60 * 1000 - Math.random() * 50 * 1000;
  // console.log(new Date(kinematic_start), new Date(kinematic_end));
  running_min -= 1;
  while (running_min > 0) {
    ste = mgen(template);
    ste.timestamp_iso = new Date(lasttime);
    ste.voltage /= 10;
    await statusSink(ste);
    await gen_kinematic_info(ste);
    running_min--;
    lasttime += 60 * 1000;
  }

  ste = mgen(template);
  ste.timestamp_iso = new Date(lasttime);
  ste.engine = "OFF";
  await statusSink(ste);
}

Number.prototype.zeroPad =
  Number.prototype.zeroPad ??
  function (base) {
    let nr = this,
      len = String(base).length - String(nr).length + 1;
    return len > 0 ? new Array(len).join("0") + nr : nr;
  };

async function gen_status(vins, starttime) {
  let start, jitter, vin;
  for (let index = 0; index < vins.length; index++) {
    vin = vins[index];
    jitter = Math.random() * 21 * 60 * 1000;
    start = new Date(starttime.getTime() + jitter);
    await gen_vehical_status(
      vin,
      (index % 10) + 1,
      (index + 1).zeroPad(1000),
      start,
    );
  }
}

async function gen_events(nVins) {
  const running_rounds = [
    new Date("2023-03-08T07:50:00+09:00"),
    new Date("2023-03-08T11:50:00+09:00"),
    new Date("2023-03-08T15:50:00+09:00"),
  ];
  const vins = gen_vins(nVins);
  for (const st of running_rounds) {
    await gen_status(vins, st);
  }
}

async function main(args) {
  const bBig = args["bigfleet"];
  const bClean = args["clean"] ?? false;
  const nVins = bBig ? 10 : 1; // TODO; fix scale
  await cli_init(bBig, bClean);
  await gen_events(nVins);

  process.exit(0);
}

const knownOpts = {
    bigfleet: Boolean,
    clean: Boolean,
  },
  shortHands = {
    b: ["--bigfleet"],
    c: ["--clean"],
  };

await main(nopt(knownOpts, shortHands, process.argv, 2));
