/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const VehicleProfile = require('./VehicleProfileRoute');

module.exports = [
  { method: 'POST', path: '/VehicleProfile/insert', config: VehicleProfile.insert },
  { method: 'POST', path: '/VehicleProfile/find', config: VehicleProfile.find },
  { method: 'POST', path: '/VehicleProfile/findById', config: VehicleProfile.findById },
  { method: 'POST', path: '/VehicleProfile/updateById', config: VehicleProfile.updateById },
  { method: 'POST', path: '/VehicleProfile/deleteById', config: VehicleProfile.deleteById },

  { method: 'POST', path: '/VehicleProfile/advanceUser/insert', config: VehicleProfile.advanceUserInsert },
  { method: 'POST', path: '/VehicleProfile/advanceUser/find', config: VehicleProfile.advanceUserFind },
  { method: 'POST', path: '/VehicleProfile/advanceUser/search', config: VehicleProfile.advanceUserSearch },
  { method: 'POST', path: '/VehicleProfile/advanceUser/deleteById', config: VehicleProfile.advanceUserDeleteById },
  { method: 'POST', path: '/VehicleProfile/advanceUser/findById', config: VehicleProfile.advanceUserFindById },
  { method: 'POST', path: '/VehicleProfile/advanceUser/updateById', config: VehicleProfile.advanceUserUpdateById },
];
