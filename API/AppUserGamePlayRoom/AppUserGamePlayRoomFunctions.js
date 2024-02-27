/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const AppUserGamePlayRoomResourceAccess = require('./resourceAccess/AppUserGamePlayRoomResourceAccess');
const GamePlayRoomResourceAccess = require('../GamePlayRoom/resourceAccess/GamePlayRoomResourceAccess');
const { hashPassword } = require('../AppUsers/AppUsersFunctions');
const { GAMEROOM_TYPE, GAME_GROUP, USER_INROM } = require('../GamePlayRoom/GamePlayRoomConstant');
const Logger = require('../../utils/logging');

async function joinRoom(appUserId, gameRoomId, gameRoomPassword, joinRoomA) {
  try {
    const gameRoomRecord = await GamePlayRoomResourceAccess.findById(gameRoomId);
    //kiem tra phong ton tai
    if (!gameRoomRecord) {
      return null;
    }
    //ktra mat khau
    if (gameRoomRecord.gameRoomPassword) {
      if (!gameRoomPassword) {
        return null;
      }
      const password = hashPassword(gameRoomPassword);
      if (gameRoomRecord.gameRoomPassword != password) {
        return null;
      }
    }
    if (gameRoomRecord.gameRoomType == GAMEROOM_TYPE.LEADER) {
      let result = await AppUserGamePlayRoomResourceAccess.insert({ appUserId: appUserId, gameRoomId: gameRoomId });
      return result;
    }
    if (gameRoomRecord.gameRoomType == GAMEROOM_TYPE.DOIKHANGNHOM) {
      if (joinRoomA) {
        let result = await AppUserGamePlayRoomResourceAccess.insert({
          appUserId: appUserId,
          gameRoomId: gameRoomId,
        });
        return result;
      } else {
        let result = await AppUserGamePlayRoomResourceAccess.insert({
          appUserId: appUserId,
          gameRoomId: gameRoomId,
          room: GAME_GROUP.NHOMB,
        });
        return result;
      }
    }
    return null;
  } catch (e) {
    Logger.error(`error join game room:`, e);
    return null;
  }
}
async function exitRoom(appUserId, gameRoomId) {
  try {
    const appUserGameRooms = await AppUserGamePlayRoomResourceAccess.find({ appUserId: appUserId, gameRoomId: gameRoomId }, 0, 1);
    //kiem tra phong ton tai va nguoi choi da join chua
    if (!appUserGameRooms || appUserGameRooms.length <= 0) {
      return null;
    }
    const updateResult = await AppUserGamePlayRoomResourceAccess.updateById(appUserGameRooms[0].appUserGamePlayRoomId, {
      userInRoomStatus: USER_INROM.EXITED,
    });
    return updateResult;
  } catch (e) {
    Logger.error(`error exit game room:`, e);
    return null;
  }
}

module.exports = {
  exitRoom,
  joinRoom,
};
