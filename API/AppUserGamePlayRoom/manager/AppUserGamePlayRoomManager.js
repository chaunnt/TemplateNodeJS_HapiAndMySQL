/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const AppUserGamePlayRoomFunctions = require('../AppUserGamePlayRoomFunctions');
const Logger = require('../../../utils/logging');
async function userJoinRoom(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let joinData = req.payload;
      let user = req.currentUser;
      if (!user) {
        reject('failed');
      }
      let result = await AppUserGamePlayRoomFunctions.joinRoom(user.appUserId, joinData.gameRoomId, joinData.gameRoomPassword, joinData.joinRoomA);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`join fail game room: ${result}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error join game room:`, e);
      reject('failed');
    }
  });
}

async function userExitRoom(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRoomId = req.payload.gameRoomId;
      let user = req.currentUser;
      if (!user) {
        reject('failed');
      }
      let result = await AppUserGamePlayRoomFunctions.exitRoom(user.appUserId, gameRoomId);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`exit fail game room: ${result}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error exit game room:`, e);
      reject('failed');
    }
  });
}

module.exports = {
  userJoinRoom,
  userExitRoom,
};
