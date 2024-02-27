/* Copyright (c) 2022-2024 Reminano */

const AppUserDevices = require('./AppUserDevicesRoute');

module.exports = [
  { method: 'POST', path: '/AppUserDevices/insert', config: AppUserDevices.insert },
  { method: 'POST', path: '/AppUserDevices/find', config: AppUserDevices.find },
  // { method: 'POST', path: '/AppUserDevices/findById', config: AppUserDevices.findById },
  // { method: 'POST', path: '/AppUserDevices/updateById', config: AppUserDevices.updateById },
  // { method: 'POST', path: '/AppUserDevices/deleteById', config: AppUserDevices.deleteById }
];
