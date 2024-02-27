/* Copyright (c) 2022-2023 Reminano */

const StaffPermission = require('./StaffPermissionRoute');

module.exports = [
  { method: 'POST', path: '/StaffPermission/getList', config: StaffPermission.find },
  // { method: 'POST', path: '/StaffPermission/insert', config: StaffPermission.insert },//currently disable - no need
  // { method: 'POST', path: '/StaffPermission/getDetailById', config: StaffPermission.findById },//currently disable - no need
  // { method: 'POST', path: '/StaffPermission/updateById', config: StaffPermission.updateById },//currently disable - no need
];
