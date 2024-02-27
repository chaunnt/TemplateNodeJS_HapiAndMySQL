/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserRole = require('./AppUserRoleRoute');

module.exports = [
  { method: 'POST', path: '/AppUserRole/find', config: AppUserRole.find },
  { method: 'POST', path: '/AppUserRole/advanceUser/find', config: AppUserRole.advanceUserGetList },
];
