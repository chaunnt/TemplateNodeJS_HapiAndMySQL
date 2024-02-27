/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const StationDevices = require('./StationDevicesRoute');

module.exports = [
  { method: 'POST', path: '/StationDevices/insert', config: StationDevices.insert },
  { method: 'POST', path: '/StationDevices/findById', config: StationDevices.findById },
  { method: 'POST', path: '/StationDevices/find', config: StationDevices.find },
  { method: 'POST', path: '/StationDevices/updateById', config: StationDevices.updateById },
  { method: 'POST', path: '/StationDevices/deleteById', config: StationDevices.deleteById },

  { method: 'POST', path: '/StationDevices/advanceUser/advanceUserInsertStationDevice', config: StationDevices.advanceUserInsertStationDevice },
  { method: 'POST', path: '/StationDevices/advanceUser/advanceUserGetStationDeviceById', config: StationDevices.advanceUserGetStationDeviceById },
  { method: 'POST', path: '/StationDevices/advanceUser/advanceUserGetListStationDevices', config: StationDevices.advanceUserGetListStationDevices },
  {
    method: 'POST',
    path: '/StationDevices/advanceUser/advanceUserUpdateStationDeviceById',
    config: StationDevices.advanceUserUpdateStationDeviceById,
  },
  {
    method: 'POST',
    path: '/StationDevices/advanceUser/advanceUserDeleteStationDeviceById',
    config: StationDevices.advanceUserDeleteStationDeviceById,
  },
];
