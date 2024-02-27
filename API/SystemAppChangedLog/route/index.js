/* Copyright (c) 2022-2023 Reminano */

const SystemAppLogAppUserRoute = require('./SystemAppLogAppUserRoute');
module.exports = [
  //TODO LATER
  { method: 'POST', path: '/SystemAppLogAppUser/getAppLogAppUser', config: SystemAppLogAppUserRoute.getAppLogAppUser },
];
