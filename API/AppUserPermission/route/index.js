/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserPermission = require('./AppUserPermissionRoute');

module.exports = [
  { method: 'POST', path: '/AppUserPermission/find', config: AppUserPermission.find },
  { method: 'POST', path: '/AppUserPermission/advanceUser/list', config: AppUserPermission.advanceUserGetList },
];
