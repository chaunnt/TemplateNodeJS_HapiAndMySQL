/* Copyright (c) 2022-2024 Reminano */

const AppUserGamePlayRoom = require('./AppUserGamePlayRoom');

module.exports = [
  //Payment Deposit  APIs
  { method: 'POST', path: '/AppUserGamePlayRoom/user/joinRoom', config: AppUserGamePlayRoom.userJoinRoom },
  { method: 'POST', path: '/AppUserGamePlayRoom/user/exitRoom', config: AppUserGamePlayRoom.userExitRoom },
];
