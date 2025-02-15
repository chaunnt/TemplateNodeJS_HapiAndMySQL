/* Copyright (c) 2023 TORITECH LIMITED 2022 */

module.exports = {
  WORKING_STATUS: {
    ACTIVE: 1,
    NOT_ACTIVE: 0,
  },
  STATION_WORK_SCHEDULE_ERRORS: {
    STATION_NOT_FOUND: 'STATION_NOT_FOUND',
  },
  ALLOW_VEHICLE_TYPE_STATUS: {
    ENABLE: 1,
    DISABLE: 0,
  },
  CACHE_KEYS: {
    STATION_WORK_SCHEDULE_BY_DATE: `STATION_WORK_SCHEDULE_{stationsId}_{dateSchedule}`,
  },
};
