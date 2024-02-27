/* Copyright (c) 2022-2024 Reminano */

const GameRecordRoute = require('./GameRecordRoute');
const GameRecordRoute_User = require('./GameRecordRoute_User');

module.exports = [
  //Payment Deposit  APIs
  { method: 'POST', path: '/GameRecord/find', config: GameRecordRoute.find },
  { method: 'POST', path: '/GameRecord/updateById', config: GameRecordRoute.updateById },
  { method: 'POST', path: '/GameRecord/admin/assignResult', config: GameRecordRoute.adminAssignResult },
  { method: 'POST', path: '/GameRecord/admin/getAssignedResult', config: GameRecordRoute.adminGetAssignedResult },
  { method: 'POST', path: '/GameRecord/findById', config: GameRecordRoute.findById },
  // { method: 'POST', path: '/GameRecord/deleteById', config: GameRecordRoute.deleteById },

  // { method: 'POST', path: '/GameRecord/getCurrentGameRecord', config: GameRecordRoute.getCurrentGameRecord },

  { method: 'POST', path: '/GameRecord/user/getList', config: GameRecordRoute_User.getList },
  { method: 'POST', path: '/GameRecord/user/getListResult', config: GameRecordRoute_User.userGetListResult },
  // { method: 'POST', path: '/GameRecord/user/getCurrent', config: GameRecordRoute_User.userGetCurrentGameRecord },
  // { method: 'POST', path: '/GameRecord/user/getLast', config: GameRecordRoute_User.userGetLatestGameRecord },
];
