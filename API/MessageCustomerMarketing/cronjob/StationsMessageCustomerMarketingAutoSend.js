/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationsResource = require('../../Stations/resourceAccess/StationsResourceAccess');

const CustomerMessageMarketingSMSProcess = require('./MessageCustomerMarketingSMSJob');
const CustomerMessageMarketingZNSProcess = require('./MessageCustomerMarketingZNSJob');

async function autoSendMessageForCustomer() {
  console.info(`autoSendMessageForCustomer`);
  let stationsList = await StationsResource.find({}, undefined, undefined);

  if (stationsList && stationsList.length > 0) {
    for (let i = 0; i < stationsList.length; i++) {
      const station = stationsList[i];
      await Promise.all([
        CustomerMessageMarketingZNSProcess.sendMessageZNSToCustomer(station),
        CustomerMessageMarketingSMSProcess.sendMessageSMSToCustomer(station),
      ]);
    }
  }
}

module.exports = {
  autoSendMessageForCustomer,
};
