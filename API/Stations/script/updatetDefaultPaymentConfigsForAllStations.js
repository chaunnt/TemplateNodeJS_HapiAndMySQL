/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationsResourceAccess = require('../resourceAccess/StationsResourceAccess');
const { updateDefaultPaymentConfigsStations } = require('../StationsFunctions');

async function updateDefaultPaymentConfigsForAllStations() {
  let stationsListCount = await StationsResourceAccess.count({});

  if (stationsListCount && stationsListCount > 0) {
    console.info(`stationsListCount has ${stationsListCount} item`);
  } else {
    console.info(`stationsListCount is empty`);
    return;
  }

  if (stationsListCount <= 0) {
    console.info(`stationsListCount has no station`);
    return;
  }

  for (let i = 0; i < stationsListCount; i++) {
    let _station = await StationsResourceAccess.find({}, i, 1);
    if (_station && _station.length > 0) {
      _station = _station[0];
    } else {
      continue;
    }

    let stationsId = _station.stationsId;

    await updateDefaultPaymentConfigsStations(stationsId);
  }
  console.info(`Completed updateDefaultPaymentConfigsForAllStations`);
}

updateDefaultPaymentConfigsForAllStations();

module.exports = {
  updateDefaultPaymentConfigsForAllStations,
};
