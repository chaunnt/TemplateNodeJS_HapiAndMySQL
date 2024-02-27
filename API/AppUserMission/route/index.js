/* Copyright (c) 2022-2024 Reminano */

const AppUserMission = require('./AppUserMissionRoute');

module.exports = [
  //AppUserMission APIs
  { method: 'POST', path: '/AppUserMission/user/playMission', config: AppUserMission.userPlayMission },
  { method: 'POST', path: '/AppUserMission/user/getMissionHistory', config: AppUserMission.userGetMissionHistory },
  { method: 'POST', path: '/AppUserMission/find', config: AppUserMission.find },
  { method: 'POST', path: '/AppUserMission/lockUserMission', config: AppUserMission.lockUserMissionPlay },
  { method: 'POST', path: '/AppUserMission/lockUserMissionBonus', config: AppUserMission.lockUserMissionBonus },
  { method: 'POST', path: '/AppUserMission/resetMissionByUserId', config: AppUserMission.resetMissionByUserId },
  // { method: 'POST', path: '/AppUserMission/updateById', config: AppUserMission.updateById },
  // { method: 'POST', path: '/AppUserMission/deleteById', config: AppUserMission.deleteById },
  // {
  //   method: 'POST',
  //   path: '/AppUserMission/user/getListMemberShip',
  //   config: AppUserMission.userGetListMemberShip,
  // },
];
