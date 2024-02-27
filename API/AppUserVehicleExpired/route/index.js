/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const AppUserVehicleExpired = require('./AppUserVehicleExpiredRoute');

module.exports = [
  { method: 'POST', path: '/AppUserVehicleExpired/insert', config: AppUserVehicleExpired.insert },
  { method: 'POST', path: '/AppUserVehicleExpired/findById', config: AppUserVehicleExpired.findById },
  { method: 'POST', path: '/AppUserVehicleExpired/find', config: AppUserVehicleExpired.find },
  { method: 'POST', path: '/AppUserVehicleExpired/updateById', config: AppUserVehicleExpired.updateById },
  { method: 'POST', path: '/AppUserVehicleExpired/deleteById', config: AppUserVehicleExpired.deleteById },
];
