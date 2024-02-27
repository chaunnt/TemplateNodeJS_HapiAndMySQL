/* Copyright (c) 2022 Reminano */

const StakingRoute = require('./StakingPackageRoute');
const UserStakingRoute = require('./StakingPackageUserRoute');

module.exports = [
  {
    method: 'POST',
    path: '/StakingPackage/insert',
    config: StakingRoute.insert,
  },
  {
    method: 'POST',
    path: '/StakingPackage/updateById',
    config: StakingRoute.updateById,
  },
  { method: 'POST', path: '/StakingPackage/find', config: StakingRoute.find },
  {
    method: 'POST',
    path: '/StakingPackage/findById',
    config: StakingRoute.findById,
  },
  {
    method: 'POST',
    path: '/StakingPackage/deleteById',
    config: StakingRoute.deleteById,
  },
  {
    method: 'POST',
    path: '/StakingPackage/getList',
    config: UserStakingRoute.find,
  },

  {
    method: 'POST',
    path: '/StakingPackage/user/getList',
    config: StakingRoute.userGetListStaking,
  },
  {
    method: 'POST',
    path: '/StakingPackage/user/requestStaking',
    config: UserStakingRoute.userRequestStaking,
  },
  {
    method: 'POST',
    path: '/StakingPackage/user/historyStaking',
    config: UserStakingRoute.getUserStakingHistory,
  },
];
