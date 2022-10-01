/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const Permission = require('./PermissionRoute');

module.exports = [
  { method: 'POST', path: '/Permission/getList', config: Permission.find },
  // { method: 'POST', path: '/Permission/insert', config: Permission.insert },//currently disable - no need
  // { method: 'POST', path: '/Permission/getDetailById', config: Permission.findById },//currently disable - no need
  // { method: 'POST', path: '/Permission/updateById', config: Permission.updateById },//currently disable - no need
];
