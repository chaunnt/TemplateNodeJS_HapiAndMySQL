/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SystemApiKeyRoute = require('./SystemApiKeyRoute');

module.exports = [
  { method: 'POST', path: '/SystemApiKey/insert', config: SystemApiKeyRoute.insert },
  { method: 'POST', path: '/SystemApiKey/find', config: SystemApiKeyRoute.find },
  { method: 'POST', path: '/SystemApiKey/findById', config: SystemApiKeyRoute.findById },
  { method: 'POST', path: '/SystemApiKey/updateById', config: SystemApiKeyRoute.updateById },
  { method: 'POST', path: '/SystemApiKey/deleteById', config: SystemApiKeyRoute.deleteById },
];
