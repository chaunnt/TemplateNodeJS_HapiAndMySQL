/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const AppUserVehicleService = require('./AppUserVehicleServiceRoute');

module.exports = [
  { method: 'POST', path: '/AppUserVehicleService/insert', config: AppUserVehicleService.insert },
  { method: 'POST', path: '/AppUserVehicleService/findById', config: AppUserVehicleService.findById },
  { method: 'POST', path: '/AppUserVehicleService/find', config: AppUserVehicleService.find },
  { method: 'POST', path: '/AppUserVehicleService/updateById', config: AppUserVehicleService.updateById },
  { method: 'POST', path: '/AppUserVehicleService/deleteById', config: AppUserVehicleService.deleteById },
];
