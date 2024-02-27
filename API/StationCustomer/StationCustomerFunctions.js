/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationCustomerAccess = require('../StationCustomer/resourceAccess/StationCustomerAccess');
const moment = require('moment');

const addStationCustomer = async (appUserId, stationsId, appUserVehicleId) => {
  const createdDate = moment().format('YYYYMMDD') * 1;

  // Kiểm tra xem khách hàng cảu tram này đã có trong bảng chưa
  const recordExisted = await StationCustomerAccess.find({
    appUserId: appUserId,
    stationsId: stationsId,
  });

  //Chưa có thì thêm mới record
  if (recordExisted.length === 0) {
    await StationCustomerAccess.insert({
      appUserId: appUserId,
      stationsId: stationsId,
      appUserVehicleId: appUserVehicleId,
      createdDate: createdDate,
    });
  }
};

module.exports = {
  addStationCustomer,
};
