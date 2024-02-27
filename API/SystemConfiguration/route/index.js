/* Copyright (c) 2022 Reminano */

const SystemConfiguration = require('./SystemConfigurationRoute');

module.exports = [
  //System configuration APIs
  {
    method: 'POST',
    path: '/SystemConfiguration/find',
    config: SystemConfiguration.find,
  },
  {
    method: 'POST',
    path: '/SystemConfiguration/updateConfigs',
    config: SystemConfiguration.updateConfigs,
  },
];
