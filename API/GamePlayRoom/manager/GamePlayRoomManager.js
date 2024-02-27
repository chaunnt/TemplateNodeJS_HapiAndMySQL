/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GamePlayRoomResourceAccess = require('../resourceAccess/GamePlayRoomResourceAccess');
const { hashPassword } = require('../../AppUsers/AppUsersFunctions');
const GamePlayRoomFunctions = require('../GamePlayRoomFunctions');
const { ERROR } = require('../../Common/CommonConstant');
const { GAMEROOM_TYPE } = require('../GamePlayRoomConstant');
const Logger = require('../../../utils/logging');
async function userJoinAsLeader(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let joinData = req.payload;
      let user = req.currentUser;
      if (!user) {
        reject('failed');
      }
      let result = await GamePlayRoomFunctions.joinAsLeader(user.appUserId, joinData.gameRoomId, joinData.gameRoomPassword);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`join as leader fail game room: ${result}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error join as leader game room:`, e);
      reject('failed');
    }
  });
}

async function userGetListGameRoom(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let gameRooms = await GamePlayRoomResourceAccess.find(filter);
      if (gameRooms && gameRooms.length > 0) {
        let gameRoomsCount = await GamePlayRoomResourceAccess.count(filter);
        resolve({ data: gameRooms, total: gameRoomsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(`Error user Get List Game Room`, e);
      reject('failed');
    }
  });
}

async function userCreateGameRoom(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRoomData = req.payload;
      let user = req.currentUser;
      if (!user) {
        reject('failed');
      }
      gameRoomData.gameRoomLogoUrl = user.userAvatar;
      if (gameRoomData.gameRoomPassword) {
        gameRoomData.gameRoomPassword = hashPassword(gameRoomData.gameRoomPassword);
      } else {
        delete gameRoomData.gameRoomPassword;
      }
      let result = await GamePlayRoomFunctions.addNewGameRoom(gameRoomData);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`insert fail game room: ${result}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error user insert game room:`, e);
      reject('failed');
    }
  });
}

async function userUpdateGameRoomById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRoomId = req.payload.id;
      let gameRoomData = req.payload.data;
      if (gameRoomData.gameRoomPassword) {
        gameRoomData.gameRoomPassword = hashPassword(gameRoomData.gameRoomPassword);
      } else {
        delete gameRoomData.gameRoomPassword;
      }
      let result = await GamePlayRoomResourceAccess.updateById(gameRoomId, gameRoomData);
      if (result) {
        resolve(result);
      } else {
        Logger.error(`error updateById game room: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error update by id ${gameRecordId} game room:`, e);
      reject('failed');
    }
  });
}

async function userDeleteGameRoomById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameRoomId = req.payload.id;
      let gameRoom = await GamePlayRoomResourceAccess.findById(gameRoomId);
      if (gameRoom && gameRoom.gameRoomType != GAMEROOM_TYPE.HETHONG) {
        let result = await GamePlayRoomResourceAccess.deleteById(gameRoomId);
        if (result) {
          resolve(result);
        } else {
          reject('failed');
        }
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  userJoinAsLeader,
  userCreateGameRoom,
  userUpdateGameRoomById,
  userDeleteGameRoomById,
  userGetListGameRoom,
};
