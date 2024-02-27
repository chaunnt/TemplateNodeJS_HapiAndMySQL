/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GamePlayRoomResourceAccess = require('./resourceAccess/GamePlayRoomResourceAccess');
const AppUserGamePlayRoomResourceAccess = require('../AppUserGamePlayRoom/resourceAccess/AppUserGamePlayRoomResourceAccess');
const { hashPassword } = require('../AppUsers/AppUsersFunctions');
const { GAMEROOM_TYPE, GAME_GROUP, GAME_PLAYERTYPE } = require('./GamePlayRoomConstant');
const { GAME_ID } = require('../GamePlayRecords/GamePlayRecordsConstant');
const Logger = require('../../utils/logging');
async function joinAsLeader(appUserId, gameRoomId, gameRoomPassword) {
  try {
    const gameRoomRecord = await GamePlayRoomResourceAccess.findById(gameRoomId);
    //kiem tra phong ton tai va leader da join chua
    if (!gameRoomRecord || gameRoomRecord.gameRoomLeaderB) {
      return null;
    }
    //ktra mat khau
    if (gameRoomRecord.gameRoomPassword) {
      if (!gameRoomPassword) {
        Logger.error(`${gameRoomId}: password incorrect`);
        return null;
      }
      const password = hashPassword(gameRoomPassword);
      if (gameRoomRecord.gameRoomPassword != password) {
        Logger.error(`${gameRoomId}: password incorrect`);
        return null;
      }
    }

    if (gameRoomRecord.gameRoomType == GAMEROOM_TYPE.DOIKHANGNHOM || gameRoomRecord.gameRoomType == GAMEROOM_TYPE.DOIKHANGDON) {
      const leaderB = await AppUserGamePlayRoomResourceAccess.find({ gameRoomId: gameRoomId, gameRoomPlayerType: GAME_PLAYERTYPE.LEADERB }, 0, 1);
      if (leaderB) {
        Logger.error(`${gameRoomId}: LeaderB is existed`);
        return null;
      }
      let result = await AppUserGamePlayRoomResourceAccess.insert({
        appUserId: appUserId,
        gameRoomId: gameRoomId,
        gameRoomPlayerType: GAME_PLAYERTYPE.LEADERB,
        group: GAME_GROUP.NHOMB,
      });
      return result;
    }
    return null;
  } catch (e) {
    Logger.error(`error join as leader game room:`, e);
    return null;
  }
}

async function addNewGameRoom(gameRoomData, appUserId) {
  try {
    if (gameRoomData.gameInfoId == parseInt(GAME_ID.BINARYOPTION) && !gameRoomData.gameType) {
      Logger.error(`error insert game BO with empty Unit`);
      return null;
    }
    //nguoi dung tao
    gameRoomData.gameRoomTimeLeft = 600;
    let insertResult = await GamePlayRoomResourceAccess.insert(gameRoomData);
    if (insertResult > 0) {
      //add leader
      await AppUserGamePlayRoomResourceAccess.insert({
        appUserId: appUserId,
        gameRoomId: insertResult,
        gameRoomPlayerType: GAME_PLAYERTYPE.LEADERA,
      });
    }
    return insertResult;
  } catch (e) {
    Logger.error(`error insert game room:`, e);
    return null;
  }
}

module.exports = {
  joinAsLeader,
  addNewGameRoom,
};
