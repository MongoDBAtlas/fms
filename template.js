export const status_template = {
  command_id: null,
  command_result: null,
  type: "status",
  customer_id: 1000,
  fleet_intg_id: "02",
  vin: null,
  command: "get_status",
  object: "vehicle",
  message_at: "",
  timestamp_iso: "",
  fuel_percent: { $integer: { min: 80, max: 100 } },
  odometer: 0,
  distance: 0,
  fuel_level: 0,
  loc: "$point",
  charge_level: -2,
  speed: 0,
  voltage: { $integer: { min: 140, max: 160 } },
  charge_percent: { $integer: { min: 80, max: 100 } },
  engine: "ON",
  charge_state: "NONE",
  charger_connect: "NONE",
};

export const kinematic_template = {
  command_id: null,
  command_result: null,
  command: "kinematic_info",
  object: "vehicle",
  customer_id: 1000,
  fleet_intg_id: "02",
  vin: null,
  type: "kinematic",
  message_at: "",
  timestamp_iso: "",
  speed: 0,
  rpm: 0,
  loc: "$point",
  accmag: {
    heading: 0,
    hz: 20,
    x: {
      $array: {
        of: { $integer: { min: 5, max: 9 } },
        number: 20,
      },
    },
    y: {
      $array: {
        of: { $integer: { min: 5, max: 9 } },
        number: 20,
      },
    },
    z: {
      $array: {
        of: { $integer: { min: 5, max: 9 } },
        number: 20,
      },
    },
  },
};
