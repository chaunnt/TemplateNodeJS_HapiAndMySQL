/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationSettingResourceAccess = require('./resourceAccess/StationSettingResourceAccess');

let defaultData = {
  chatLinkEmployeeToUser: '',
  chatLinkUserToEmployee: '',
};

async function getSettingByStationId(stationId) {
  // Kiểm tra trạm đã có setting trong db chưa
  const stationSettingExisted = await StationSettingResourceAccess.findById(stationId);

  // Chưa có thì tạo mới setting cho station với các giá trị mặt định
  if (!stationSettingExisted) {
    await StationSettingResourceAccess.insert({
      stationsId: stationId,
      ...defaultData,
    });

    // Lấy setting của trạm vừa mới tạo trả về cho client
    const stationSetting = await StationSettingResourceAccess.findById(stationId);

    return stationSetting;
  } else {
    return stationSettingExisted;
  }
}

async function updateSettingByStationId(stationId, updateData) {
  // Kiểm tra trạm đã có setting trong db chưa
  const stationSettingExisted = await StationSettingResourceAccess.findById(stationId);

  // Chưa có thì tạo mới setting cho station
  if (!stationSettingExisted) {
    await StationSettingResourceAccess.insert({
      stationsId: stationId,
      ...updateData,
    });
  } else {
    // Cập nhật setting
    await StationSettingResourceAccess.updateById(stationId, updateData);
  }
}

module.exports = {
  getSettingByStationId,
  updateSettingByStationId,
};
