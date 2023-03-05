import mgen from "mgeneratejs";
import { status_template, kinematic_template } from "./template.js";
import nopt from "nopt";
import { statusSink, kinematicSink, flush_source } from "./evsink.js";
import { fmscol, cli_init } from "./mongocli.js";
import path from "path";
import { BSD } from "./bsondumper.js";
import { Random } from "random";
import seedrandom from "seedrandom";

const rng = (function () {
  const prng = new Random(seedrandom(new Date().getTime().toString()));
  return function () {
    return prng.float();
  };
})();

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

function newspeed(speed) {
  let inc = Math.floor(rng() * 11) - 3;
  speed += inc;
  speed = Math.min(speed, 140);
  speed = Math.max(10, speed);
  return speed;
}

function rpm() {
  let rpm = Math.floor(rng() * 16);
  return 3000 + rpm * 100;
}

function shuffleaccmag(accmag) {
  accmag.x.sort(() => rng() - 0.5);
  accmag.y.sort(() => rng() - 0.5);
  accmag.z.sort(() => rng() - 0.5);
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
  let kme = mgen(template);
  kme.accmag.x = kme.accmag.x.map((v) => v / 10);
  kme.accmag.y = kme.accmag.y.map((v) => v / 10);
  kme.accmag.z = kme.accmag.z.map((v) => v / 10);
  let speed = evStatus.speed;
  let x, y, z;

  while (evsec < round_end) {
    kme.timestamp_iso = new Date(evsec);
    kme.speed = newspeed(speed);
    kme.rpm = rpm();
    shuffleaccmag(kme.accmag);
    await kinematicSink(kme);

    speed = kme.speed;
    evsec = evsec + 1000;
    if (evsec >= kinematic_end) break;
  }

  evStatus.speed = newspeed(speed);
}

async function gen_vehical_status(vin, customer_id, fleet_id, lasttime) {
  let running_min = 3 * 60; // 3-hr driving before 1-hr rest
  let template = {
    ...status_template,
    customer_id: customer_id,
    fleet_intg_id: fleet_id,
    vin: vin,
  };

  let ste = mgen(template);
  lasttime = lasttime.getTime();
  kinematic_start = lasttime + rng() * 60 * 1000 + 30 * 1000;
  kinematic_end = lasttime + (running_min - 1) * 60 * 1000 - rng() * 50 * 1000;
  // console.log(new Date(kinematic_start), new Date(kinematic_end));
  running_min -= 1;
  while (running_min > 0) {
    ste.timestamp_iso = new Date(lasttime);
    ste.voltage /= 10;
    await statusSink(ste);
    await gen_kinematic_info(ste);
    running_min--;
    lasttime += 60 * 1000;
  }

  ste.speed = 0;
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
  const nFleetPerCustomer = vins.length / 100;
  let start, jitter, vin;
  for (let index = 0; index < vins.length; index++) {
    vin = vins[index];
    jitter = rng() * 21 * 60 * 1000; // top of the hour +/- 10min
    start = new Date(starttime.getTime() + jitter);
    await gen_vehical_status(
      vin,
      (index % nFleetPerCustomer) + 1,
      (index + 1).zeroPad(10000),
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
  const fpath = args["file"];
  const nVins = bBig ? 2000 : 1000;

  await cli_init(bBig, bClean);
  BSD(fpath);

  console.log(`> generate vin[${nVins}]...`);
  const timeStart = new Date();
  await gen_events(nVins);
  await flush_source();
  const timeEnd = new Date();
  BSD().close();

  console.log("> start time  :", timeStart);
  console.log("> end time    :", timeEnd);
  console.log("> elapsed secs:", timeEnd.getTime() - timeStart.getTime());

  console.log("> create asc index for { customer_id, fleet_intg_id }");
  await fmscol.createIndex({
    "vehicle.customer_id": 1,
    "vehicle.fleet_intg_id": 1,
  });
  console.log("> create asc index for { vehicle.fleet_intg_id }");
  await fmscol.createIndex({
    "vehicle.fleet_intg_id": 1,
  });
  console.log("> create asc index for { vehicle }");
  await fmscol.createIndex({
    vehicle: 1,
  });

  process.exit(0);
}

const knownOpts = {
    bigfleet: Boolean,
    clean: Boolean,
    file: path,
  },
  shortHands = {
    b: ["--bigfleet"],
    c: ["--clean"],
    f: ["--file"],
  };

await main(nopt(knownOpts, shortHands, process.argv, 2));
