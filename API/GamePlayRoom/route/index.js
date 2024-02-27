/* Copyright (c) 2022-2024 Reminano */

const GamePlayRoomRoute_User = require('./GamePlayRoomRoute_User');

module.exports = [
  //Payment Deposit  APIs
  { method: 'POST', path: '/GamePlayRoom/user/getList', config: GamePlayRoomRoute_User.getList },
  { method: 'POST', path: '/GamePlayRoom/user/joinAsLeader', config: GamePlayRoomRoute_User.userJoinAsLeader },
  { method: 'POST', path: '/GamePlayRoom/user/insert', config: GamePlayRoomRoute_User.userInsert },
  { method: 'POST', path: '/GamePlayRoom/user/updateById', config: GamePlayRoomRoute_User.userUpdateById },
];
