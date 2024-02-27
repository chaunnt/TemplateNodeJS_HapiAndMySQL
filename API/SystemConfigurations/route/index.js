/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SystemConfigurations = require('./SystemConfigurationsRoute');

module.exports = [
  { method: 'POST', path: '/SystemConfigurations/findById', config: SystemConfigurations.findById },
  { method: 'POST', path: '/SystemConfigurations/updateById', config: SystemConfigurations.updateById },
  { method: 'POST', path: '/SystemConfigurations/getMetaData', config: SystemConfigurations.getMetaData },

  { method: 'POST', path: '/SystemConfigurations/user/getPublicSystemConfigurations', config: SystemConfigurations.getPublicSystemConfigurations },
];
