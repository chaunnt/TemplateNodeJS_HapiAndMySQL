/* Copyright (c) 2022-2023 Reminano */

const LeaderBoardRouter = require('./LeaderBoardRouter');

module.exports = [
  // { method: 'POST', path: '/LeaderBoard/insert', config: LeaderBoardRouter.insert },
  // { method: 'POST', path: '/LeaderBoard/user/getTopRank', config: LeaderBoardRouter.userGetTopRank },
  // { method: 'POST', path: '/LeaderBoard/admin/updateRanking', config: LeaderBoardRouter.updateRanKing },
  { method: 'POST', path: '/LeaderBoard/find', config: LeaderBoardRouter.find },
  { method: 'POST', path: '/LeaderBoard/getLeaderBoardDaily', config: LeaderBoardRouter.getLeaderBoardDaily },
];
