/* Copyright (c) 2023-2024 Reminano */

const AppUserInfoRoute = require('./AppUserInfoRoute');
const AppUserFollowRoute = require('./AppUserFollowRoute');

module.exports = [
  // AppUsers APIs
  { method: 'POST', path: '/AppUserExpert/user/getAllExperts', config: AppUserInfoRoute.userGetAllExperts },
  { method: 'POST', path: '/AppUserExpert/user/getExpertInfo', config: AppUserInfoRoute.userGetExpertInfo },
  { method: 'POST', path: '/AppUserExpert/user/getFollowingExperts', config: AppUserFollowRoute.userGetFollowingExperts },
  { method: 'POST', path: '/AppUserExpert/user/followExpert', config: AppUserFollowRoute.followExpert },
  { method: 'POST', path: '/AppUserExpert/user/updateFollowInfo', config: AppUserFollowRoute.userUpdateFollowInfo },
  { method: 'POST', path: '/AppUserExpert/user/stopCopyTrade', config: AppUserFollowRoute.stopCopyTrade },
  { method: 'POST', path: '/AppUserExpert/user/unfollowExpert', config: AppUserFollowRoute.unfollowExpert },
];
