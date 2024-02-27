/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const Permission = require('./PermissionRoute');

module.exports = [
  // { method: 'POST', path: '/Permission/insert', config: Permission.insert },
  { method: 'POST', path: '/Permission/find', config: Permission.find },
  // { method: 'POST', path: '/Permission/getDetailById', config: Permission.findById },
  // { method: 'POST', path: '/Permission/updateById', config: Permission.updateById },
];
