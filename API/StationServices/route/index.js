/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const StationServices = require('./StationServicesRoute');

module.exports = [
  // { method: 'POST', path: '/StationServices/insert', config: StationServices.insert }, // Tạm thời chưa được sử dụng
  // { method: 'POST', path: '/StationServices/findById', config: StationServices.findById }, // Tạm thời chưa được sử dụng
  // { method: 'POST', path: '/StationServices/find', config: StationServices.find }, // Tạm thời chưa được sử dụng
  // { method: 'POST', path: '/StationServices/updateById', config: StationServices.updateById }, // Tạm thời chưa được sử dụng
  // { method: 'POST', path: '/StationServices/deleteById', config: StationServices.deleteById }, // Tạm thời chưa được sử dụng

  { method: 'POST', path: '/StationServices/advanceUser/insert', config: StationServices.advanceUserInsert },
  { method: 'POST', path: '/StationServices/advanceUser/delete', config: StationServices.advanceUserDeleteById },
  { method: 'POST', path: '/StationServices/advanceUser/list', config: StationServices.advanceUserList },

  { method: 'POST', path: '/StationServices/user/getListStationService', config: StationServices.userGetListStationService },
];
