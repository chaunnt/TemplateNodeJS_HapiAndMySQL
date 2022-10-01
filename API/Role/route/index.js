/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const Role = require('./RoleRoute');

module.exports = [
  { method: 'POST', path: '/Role/insert', config: Role.insert },
  { method: 'POST', path: '/Role/getList', config: Role.find },
  { method: 'POST', path: '/Role/updateById', config: Role.updateById },
  // { method: 'POST', path: '/Role/getDetailById', config: Role.findById }, //currently disable - no need
];
