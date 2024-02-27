/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const SystemApiKeyFunction = require('../SystemApiKeyFunction');

async function createApiKeyForAllStation() {
  console.info(`START CREATE API KEY FOR ALL STATIONS ${new Date()}`);

  let skip = 0;
  let batchSize = 20;

  while (true) {
    let stations = await StationsResourceAccess.find({}, skip, batchSize);

    if (stations && stations.length > 0) {
      const promiseSplit = stations.map(station => {
        return SystemApiKeyFunction.createNewApiKey({
          apiKeyName: station.stationCode,
          stationsId: station.stationsId,
        });
      });

      await Promise.all(promiseSplit);

      skip += batchSize;
    } else {
      break;
    }
  }

  console.info(`FINISH CREATE API KEY FOR ALL STATIONS ${new Date()}`);
}

createApiKeyForAllStation();

module.exports = {
  createApiKeyForAllStation,
};
