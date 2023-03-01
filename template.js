export const status_template = {
  command_id: null,
  command_result: null,
  type: "status",
  customer_id: 1000,
  fleet_intg_id: "02",
  vin: null,
  command: "get_status",
  object: "vehicle",
  messaged_at: "",
  timestamp_iso: "",
  fuel_percent: { $integer: { min: 40, max: 100 } },
  odometer: 0,
  distance: 0,
  fuel_level: 0,
  loc: "$point",
  charge_level: -2,
  speed: { $integer: { min: 80, max: 110 } },
  voltage: { $decimal: { fixed: 1, min: 14, max: 15.8 } },
  charge_percent: { $integer: { min: 30, max: 100 } },
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
  speed: { $integer: { min: 80, max: 110 } },
  rpm: { $integer: { min: 3000, max: 4500 } },
  loc: "$point",
  accmag: {
    heading: 0,
    hz: 20,
    x: {
      $array: {
        of: { $decimal: { fixed: 3, min: 0.5, max: 0.9 } },
        number: 20,
      },
    },
    y: {
      $array: {
        of: { $decimal: { fixed: 3, min: 0.5, max: 0.9 } },
        number: 20,
      },
    },
    z: {
      $array: {
        of: { $decimal: { fixed: 3, min: 0.5, max: 0.9 } },
        number: 20,
      },
    },
  },
};
