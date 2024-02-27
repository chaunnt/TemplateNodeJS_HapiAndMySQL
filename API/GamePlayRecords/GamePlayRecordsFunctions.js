/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const GamePlayRecordsResource = require('./resourceAccess/GamePlayRecordsResourceAccess');
const BetRecordFakeResourceAccess = require('./resourceAccess/BetRecordFakeResourceAccess');
const GameRecordsResourceAccess = require('../GameRecord/resourceAccess/GameRecordsResourceAccess');
const WalletResource = require('../Wallet/resourceAccess/WalletResourceAccess');
const WalletRecordFunctions = require('../WalletRecord/WalletRecordFunction');
const PaymentBonusTransactionResourceAccess = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
const CustomerMessageResourceAccess = require('../CustomerMessage/resourceAccess/CustomerMessageResourceAccess');
const { BONUS_TRX_STATUS } = require('../PaymentBonusTransaction/PaymentBonusTransactionConstant');
const AppUserView = require('../AppUsers/resourceAccess/AppUserView');
const AppUser = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');
// const { GAME_STATUS } = require('../GameRecord/GameRecordConstant');
const {
  BET_STATUS,
  BET_TYPE,
  BET_RESULT,
  GAME_ID,
  GAME_VALUE,
  BET_VALUE,
  GAME_RECORD_UNIT_BO,
  BONUS_RATE,
  GAME_PLAY_CATEGORY,
  BET_AMOUNT_MAX,
  PLACE_RECORD_ERROR,
} = require('./GamePlayRecordsConstant');
const Logger = require('../../utils/logging');
const UtilFunctions = require('../ApiUtils/utilFunctions');
const AppUserMembership = require('../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
const WalletRecordResourAccess = require('../WalletRecord/resourceAccess/WalletRecordResoureAccess');
const AppUserGamePlayRoomResourceAccess = require('../AppUserGamePlayRoom/resourceAccess/AppUserGamePlayRoomResourceAccess');
const GamePlayRoomResourceAccess = require('../GamePlayRoom/resourceAccess/GamePlayRoomResourceAccess');
const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
const { LEVER_MEMBERSHIP } = require('../AppUserMembership/AppUserMembershipConstant');
const { GAMEROOM_TYPE, USER_INROM, GAMEAMOUNT_KEYCACHE, GAME_GROUP } = require('../GamePlayRoom/GamePlayRoomConstant');
const { GAME_RECORD_STATUS, GAME_SECTION_START_TIME } = require('../GameRecord/GameRecordConstant');
const { MESSAGE_STATUS, MESSAGE_TOPIC, MESSAGE_TYPE, MESSAGE_CATEGORY } = require('../CustomerMessage/CustomerMessageConstant');
const utilFunctions = require('../../API/ApiUtils/utilFunctions');
const moment = require('moment');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const { USER_REFUND_PLAY } = require('../AppUsers/AppUserConstant');
const PaymentDepositTransactionResourceAccess = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const StaffResourceAccess = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserMissionPlayResourceAccess = require('../GamePlayRecords/resourceAccess/AppUserMissionPlayResourceAccess');
const { getWalletByType } = require('../Wallet/WalletFunctions');
const { getCurrentGameSection, getTimeDiffPerSectionByGame, getFutureGameSection, isPlayGameRecord } = require('../GameRecord/GameRecordFunctions');
const { MISSION_STATUS } = require('../AppUserMission/AppUserMissionConstant');
const { publishJSONToClient } = require('../../ThirdParty/SocketIO/SocketIOClient');

let userPlayWinAmount = {}; // cache tong win trong van choi theo user
let userPlayMissionWinAmount = {}; // cache tong win trong van choi theo user
let userPlayKeys = []; // cache key cua user choi trong 1 van
let userPlayMissionKeys = []; // cache key cua user choi trong 1 van
let totalBetAmountInByUser = [];
let betRecordListByUser = [];
let betMissionRecordListByUser = [];
let totalBetMissionAmountInByUser = [];
let totalBetAmountInByBetType = {};
let totalBetAmountInByGameId = {};
let totalBetAmountInAllMemberRoomLeaderByRoomId = {}; //tong choi cua ca phong leader
let totalBetAmountInAllMemberRoomFightingByRoomId = {}; //tong choi cua toan bo phong doi khang don
let totalBetAmountInAllMemberRoomGroupFightingByRoomId = {}; //tong choi cua toan bo phong doi khang nhom
let totalBetAmountInLeaderARoomFightingByRoomId = {}; //tong choi cua leader A phong doi khang don
let totalBetAmountInLeaderBRoomFightingByRoomId = {}; //tong choi cua leader B phong doi khang don
let totalBetAmountInAGroupFightingByRoomId = {}; //tong choi cua nhom A phong doi khang nhom
let totalBetAmountInBGroupFightingByRoomId = {}; //tong choi cua nhom B phong doi khang nhom
let totalBetAmountWinRoomLeaderByRoomId = {}; //tong loi nhuan phong leader
let totalBetAmountWinRoomFightingByRoomId = {}; //tong loi nhuan phong doi khang don
let totalBetAmountWinRoomGroupFightingByRoomId = {}; //tong loi nhuan phong doi khang nhom

async function _cacheTotalAmountInLeaderRoomByRomId(roomId, betAmountIn) {
  //cache tong choi cua phong leader
  const key = `${GAMEAMOUNT_KEYCACHE.LEADER.TOTAL_AMOUNTIN}_${roomId}`;
  if (!totalBetAmountInAllMemberRoomLeaderByRoomId[key]) {
    totalBetAmountInAllMemberRoomLeaderByRoomId[key] = betAmountIn;
  } else {
    totalBetAmountInAllMemberRoomLeaderByRoomId[key] += betAmountIn;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountInAllMemberRoomLeaderByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountInAllMemberRoomLeaderByRoomId[key],
  });
}

async function _getCachedTotalAmountInLeaderRoomByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.LEADER.TOTAL_AMOUNTIN}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountInAllMemberRoomLeaderByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountInFightingRoomByRomId(roomId, betAmountIn) {
  //cache tong choi cua phong doi khang don
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTIN}_${roomId}`;
  if (!totalBetAmountInAllMemberRoomFightingByRoomId[key]) {
    totalBetAmountInAllMemberRoomFightingByRoomId[key] = betAmountIn;
  } else {
    totalBetAmountInAllMemberRoomFightingByRoomId[key] += betAmountIn;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountInAllMemberRoomFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountInAllMemberRoomFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountInFightingRoomByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTIN}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountInAllMemberRoomFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountInGroupFightingRoomByRomId(roomId, betAmountIn) {
  //cache tong choi cua phong doi khang nhom
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTIN}_${roomId}`;
  if (!totalBetAmountInAllMemberRoomGroupFightingByRoomId[key]) {
    totalBetAmountInAllMemberRoomGroupFightingByRoomId[key] = betAmountIn;
  } else {
    totalBetAmountInAllMemberRoomGroupFightingByRoomId[key] += betAmountIn;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountInAllMemberRoomGroupFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountInAllMemberRoomGroupFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountInGroupFightingRoomByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTIN}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountInAllMemberRoomGroupFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountInLeaderAByRomId(roomId, betAmountIn) {
  //cache tong choi cua leader A
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTIN_A}_${roomId}`;
  if (!totalBetAmountInLeaderARoomFightingByRoomId[key]) {
    totalBetAmountInLeaderARoomFightingByRoomId[key] = betAmountIn;
  } else {
    totalBetAmountInLeaderARoomFightingByRoomId[key] += betAmountIn;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountInLeaderARoomFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountInLeaderARoomFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountInLeaderAByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTIN_A}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountInLeaderARoomFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountInLeaderBByRomId(roomId, betAmountIn) {
  //cache tong choi cua leader B
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTIN_B}_${roomId}`;
  if (!totalBetAmountInLeaderBRoomFightingByRoomId[key]) {
    totalBetAmountInLeaderBRoomFightingByRoomId[key] = betAmountIn;
  } else {
    totalBetAmountInLeaderBRoomFightingByRoomId[key] += betAmountIn;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountInLeaderBRoomFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountInLeaderBRoomFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountInLeaderBByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTIN_B}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountInLeaderBRoomFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountInGroupAByRomId(roomId, betAmountIn) {
  //cache tong choi cua nguoi choi nhom A
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTIN_A}_${roomId}`;
  if (!totalBetAmountInAGroupFightingByRoomId[key]) {
    totalBetAmountInAGroupFightingByRoomId[key] = betAmountIn;
  } else {
    totalBetAmountInAGroupFightingByRoomId[key] += betAmountIn;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountInAGroupFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountInAGroupFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountInGroupAByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTIN_A}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountInAGroupFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountInGroupBByRomId(roomId, betAmountIn) {
  //cache tong choi cua nguoi choi nhom B
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTIN_B}_${roomId}`;
  if (!totalBetAmountInBGroupFightingByRoomId[key]) {
    totalBetAmountInBGroupFightingByRoomId[key] = betAmountIn;
  } else {
    totalBetAmountInBGroupFightingByRoomId[key] += betAmountIn;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountInBGroupFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountInBGroupFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountInGroupBByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTIN_B}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountInBGroupFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountWinRoomLeaderByRomId(roomId, betAmountWin) {
  //cache tong loi nhuan cua phong nhom
  const key = `${GAMEAMOUNT_KEYCACHE.LEADER.TOTAL_AMOUNTWIN}_${roomId}`;
  if (!totalBetAmountWinRoomLeaderByRoomId[key]) {
    totalBetAmountWinRoomLeaderByRoomId[key] = betAmountWin;
  } else {
    totalBetAmountWinRoomLeaderByRoomId[key] += betAmountWin;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountWinRoomLeaderByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountWinRoomLeaderByRoomId[key],
  });
}

async function _getCachedTotalAmountWinRoomLeaderByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.LEADER.TOTAL_AMOUNTWIN}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountWinRoomLeaderByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountWinRoomFightingByRomId(roomId, betAmountWin) {
  //cache tong loi nhuan cua phong nhom
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTWIN}_${roomId}`;
  if (!totalBetAmountWinRoomFightingByRoomId[key]) {
    totalBetAmountWinRoomFightingByRoomId[key] = betAmountWin;
  } else {
    totalBetAmountWinRoomFightingByRoomId[key] += betAmountWin;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountWinRoomFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountWinRoomFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountWinRoomFightingByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGDON.TOTAL_AMOUNTWIN}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountWinRoomFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountWinRoomGroupFightingByRomId(roomId, betAmountWin) {
  //cache tong loi nhuan cua phong nhom
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTWIN}_${roomId}`;
  if (!totalBetAmountWinRoomGroupFightingByRoomId[key]) {
    totalBetAmountWinRoomGroupFightingByRoomId[key] = betAmountWin;
  } else {
    totalBetAmountWinRoomGroupFightingByRoomId[key] += betAmountWin;
  }
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    redisCache.setWithExpire(key, totalBetAmountWinRoomGroupFightingByRoomId[key], 600);
  }
  publishJSONToClient(key, {
    betRecordAmountIn: totalBetAmountWinRoomGroupFightingByRoomId[key],
  });
}

async function _getCachedTotalAmountWinRoomGroupFightingByRomId(roomId) {
  const key = `${GAMEAMOUNT_KEYCACHE.DOIKHANGNHOM.TOTAL_AMOUNTWIN}_${roomId}`;
  if (process.env.REDIS_ENABLE) {
    const redisCache = require('../../ThirdParty/Redis/RedisInstance');
    redisCache.initRedis();
    const redisValue = redisCache.get(key);
    return redisValue | 0;
  } else {
    return totalBetAmountWinRoomGroupFightingByRoomId[key] | 0;
  }
}

async function _cacheTotalAmountWinByUser(appUserId, winAmount) {
  const appUserRooms = await AppUserGamePlayRoomResourceAccess.find({ appUserId: appUserId, userInRoomStatus: USER_INROM.PLAYING }, 0, 1, {
    key: 'appUserGamePlayRoomId',
    value: 'desc',
  });
  if (appUserRooms && appUserRooms.length > 0) {
    const appUserRoom = appUserRooms[0];
    const roomId = appUserRoom.gameRoomId;
    const room = await GamePlayRoomResourceAccess.findById(roomId);
    if (room && room.gameRoomType != GAMEROOM_TYPE.HETHONG) {
      //luu cache
      await _cacheTotalAmountWinByRoom(room, winAmount);
      //luu du lieu
      await _updateTotalAmoutnWinByRoom(room, appUserRoom, winAmount);
    }
  }
}

async function _updateTotalAmoutnWinByRoom(room, appUserRoom, winAmoun) {
  //cap nhat tien thang cho user
  const totalAmountWin = appUserRoom.gameRoomTotalAmountWin + winAmoun;
  await AppUserGamePlayRoomResourceAccess.updateById(appUserRoom.appUserGamePlayRoomId, { gameRoomTotalAmountWin: totalAmountWin });
  //cap nhat tien thang theo phong
  switch (room.gameRoomType) {
    case GAMEROOM_TYPE.LEADER:
      //phong leader
      const totalAmountWinLeader = room.gameRoomTotalAmountWinA + betAmountIn;
      await GamePlayRoomResourceAccess.updateById(room.gamePlayRoomId, { gameRoomTotalAmountWinA: totalAmountWinLeader });
      break;
    case GAMEROOM_TYPE.DOIKHANGDON:
    case GAMEROOM_TYPE.DOIKHANGNHOM:
      //doi khang don | doi khang nhom
      if (appUserRoom.group == GAME_GROUP.NHOMA) {
        //leaderA
        const totalAmountWinLeaderA = room.gameRoomTotalAmountWinA + betAmountIn;
        await GamePlayRoomResourceAccess.updateById(room.gamePlayRoomId, { gameRoomTotalAmountInA: totalAmountWinLeaderA });
      } else {
        //leaderB
        const totalAmountWinLeaderB = room.gameRoomTotalAmountWinB + betAmountIn;
        await GamePlayRoomResourceAccess.updateById(room.gamePlayRoomId, { gameRoomTotalAmountWinB: totalAmountWinLeaderB });
      }
      break;
  }
}

async function _cacheTotalAmountWinByRoom(room, winAmoun) {
  switch (room.gameRoomType) {
    case GAMEROOM_TYPE.LEADER:
      //phong leader
      await _cacheTotalAmountWinRoomLeaderByRomId(room.gamePlayRoomId, winAmoun);
      break;
    case GAMEROOM_TYPE.DOIKHANGDON:
      //phong leader
      await _cacheTotalAmountWinRoomFightingByRomId(room.gamePlayRoomId, winAmoun);
      break;
    case GAMEROOM_TYPE.LEADER:
      //phong leader
      await _cacheTotalAmountWinRoomGroupFightingByRomId(room.gamePlayRoomId, winAmoun);
      break;
  }
}

async function _cacheTotalAmountByRoom(room, appUserRoom, betAmountIn) {
  //phan loai phong
  switch (room.gameRoomType) {
    case GAMEROOM_TYPE.LEADER:
      //phong leader
      await _cacheTotalAmountInLeaderRoomByRomId(room.gamePlayRoomId, betAmountIn);
      break;
    case GAMEROOM_TYPE.DOIKHANGDON:
      //doi khang don
      //tong choi
      await _cacheTotalAmountInFightingRoomByRomId(room.gamePlayRoomId, betAmountIn);
      if (appUserRoom.group == GAME_GROUP.NHOMA) {
        //leaderA
        await _cacheTotalAmountInLeaderAByRomId(room.gamePlayRoomId, betAmountIn);
      } else {
        //leaderB
        await _cacheTotalAmountInLeaderBByRomId(room.gamePlayRoomId, betAmountIn);
      }
      break;
    case GAMEROOM_TYPE.DOIKHANGNHOM:
      //doi khang nhom
      //tong choi
      await _cacheTotalAmountInGroupFightingRoomByRomId(room.gamePlayRoomId, betAmountIn);
      if (appUserRoom.group == GAME_GROUP.NHOMA) {
        //tong nhom A
        await _cacheTotalAmountInGroupAByRomId(room.gamePlayRoomId, betAmountIn);
      } else {
        //tong nhom B
        await _cacheTotalAmountInGroupBByRomId(room.gamePlayRoomId, betAmountIn);
      }
      break;
  }
}

async function _updateTotalAmountByRoom(room, appUserRoom, betAmountIn) {
  //cap nhat tien choi cho user
  const totalAmountIn = appUserRoom.gameRoomTotalAmountIn + betAmountIn;
  await AppUserGamePlayRoomResourceAccess.updateById(appUserRoom.appUserGamePlayRoomId, { gameRoomTotalAmountIn: totalAmountIn });
  //cap nhat tien choi theo phong
  switch (room.gameRoomType) {
    case GAMEROOM_TYPE.LEADER:
      //phong leader
      const totalAmountInLeader = room.gameRoomTotalAmountInA + betAmountIn;
      await GamePlayRoomResourceAccess.updateById(room.gamePlayRoomId, { gameRoomTotalAmountInA: totalAmountInLeader });
      break;
    case GAMEROOM_TYPE.DOIKHANGDON:
    case GAMEROOM_TYPE.DOIKHANGNHOM:
      //doi khang don | doi khang nhom
      if (appUserRoom.group == GAME_GROUP.NHOMA) {
        //leaderA
        const totalAmountInLeaderA = room.gameRoomTotalAmountInA + betAmountIn;
        await GamePlayRoomResourceAccess.updateById(room.gamePlayRoomId, { gameRoomTotalAmountInA: totalAmountInLeaderA });
      } else {
        //leaderB
        const totalAmountInLeaderB = room.gameRoomTotalAmountInA + betAmountIn;
        await GamePlayRoomResourceAccess.updateById(room.gamePlayRoomId, { gameRoomTotalAmountInB: totalAmountInLeaderB });
      }
      break;
  }
}

async function _cacheAmountByUserAndRoom(appUserId, betAmountIn) {
  const appUserRooms = await AppUserGamePlayRoomResourceAccess.find({ appUserId: appUserId, userInRoomStatus: USER_INROM.PLAYING }, 0, 1, {
    key: 'appUserGamePlayRoomId',
    value: 'desc',
  });
  if (appUserRooms && appUserRooms.length > 0) {
    const appUserRoom = appUserRooms[0];
    const roomId = appUserRoom.gameRoomId;
    const room = await GamePlayRoomResourceAccess.findById(roomId);
    if (room && room.gameRoomType != GAMEROOM_TYPE.HETHONG) {
      //luu cache
      await _cacheTotalAmountByRoom(room, appUserRoom, betAmountIn);
      //luu du lieu
      await _updateTotalAmountByRoom(room, appUserRoom, betAmountIn);
    }
  }
}

async function refreshCacheTotalBetAmountInByBetType(betType, betValue) {
  const cache_topic = `${betType}_${betValue}`;
  totalBetAmountInByBetType[cache_topic] = 0;
  publishJSONToClient(cache_topic, { totalBetAmountIn: totalBetAmountInByBetType[cache_topic] });
}

//hủy hết
function clearTotalAmountInListByUser(cachedRecordList, currentUser, betType) {
  for (let i = 0; i < Object.values(BET_VALUE.BINARYOPTION).length; i++) {
    const _betValue = Object.values(BET_VALUE.BINARYOPTION)[i];
    const cache_topic = `${currentUser.appUserId}_${betType}_${_betValue}`;
    if (!cachedRecordList[betType]) {
      cachedRecordList[betType] = {};
    }

    if (cachedRecordList[betType][cache_topic]) {
      delete cachedRecordList[betType][cache_topic];
    }
  }
}

function clearTotalAmountInRecordListByUser(currentUser, betType) {
  clearTotalAmountInListByUser(totalBetAmountInByUser, currentUser, betType);
}

function clearTotalAmountInMissionRecordListByUser(currentUser, betType) {
  clearTotalAmountInListByUser(totalBetMissionAmountInByUser, currentUser, betType);
}

function refreshCachedTotalBetMissionAmountInByUser(betType) {
  totalBetMissionAmountInByUser[betType] = {};
  _refreshCachedBetMissionRecordListByUser(betType);
}

function getCachedTotalBetMissionAmountInByUser(currentUser, betType) {
  let _cacheDataByUser = [];
  for (let i = 0; i < Object.keys(BET_VALUE.BINARYOPTION).length; i++) {
    const _betValue = Object.values(BET_VALUE.BINARYOPTION)[i];
    const cache_topic = `${currentUser.appUserId}_${betType}_${_betValue}`;
    if (!totalBetMissionAmountInByUser[betType] || !totalBetMissionAmountInByUser[betType][cache_topic]) {
      _cacheDataByUser.push({
        username: UtilFunctions.replaceCharactersToHide(currentUser.username),
        betAmountIn: 0,
        recordAmountIn: 0,
        betValue: _betValue,
      });
    } else {
      _cacheDataByUser.push({
        ...totalBetMissionAmountInByUser[betType][cache_topic],
        betValue: _betValue,
      });
    }
  }

  return _cacheDataByUser;
}

async function addBetRecordListToCacheByUser(
  cachedRecordList,
  currentUser,
  betType,
  betValue,
  betAmountIn,
  gameRecordSection,
  appUserMissionHistoryId,
) {
  //TODO (nhớ xóa code tạm này)
  const cache_topic = `${currentUser.appUserId}`;
  if (!cachedRecordList[betType]) {
    cachedRecordList[betType] = {};
  }

  if (!cachedRecordList[betType][cache_topic]) {
    cachedRecordList[betType][cache_topic] = [];
  }

  let _newRecord = {
    username: UtilFunctions.replaceCharactersToHide(currentUser.username),
    betAmountIn: betAmountIn,
    recordAmountIn: betAmountIn,
    betValue: betValue,
    gameRecordSection: gameRecordSection,
    appUserId: currentUser.appUserId,
    appUserMissionHistoryId: appUserMissionHistoryId,
  };

  cachedRecordList[betType][cache_topic].push(_newRecord);
}

async function removeBetRecordListToCacheByUser(cachedRecordList, currentUser, betType) {
  const cache_topic = `${currentUser.appUserId}`;
  if (!cachedRecordList[betType]) {
    cachedRecordList[betType] = {};
  }

  if (!cachedRecordList[betType][cache_topic]) {
    cachedRecordList[betType][cache_topic] = [];
  }

  cachedRecordList[betType][cache_topic].pop();
}

function _getBetRecordListFromCacheByUser(cachedRecordList, currentUser, betType) {
  const cache_topic = `${currentUser.appUserId}`;
  if (!cachedRecordList[betType]) {
    cachedRecordList[betType] = {};
  }

  if (!cachedRecordList[betType][cache_topic]) {
    cachedRecordList[betType][cache_topic] = [];
  }

  return cachedRecordList[betType][cache_topic];
}

function getAllBetRecordListByUser(currentUser) {
  let _allRecordList = {};
  for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    const _betType = Object.values(BET_TYPE)[i];
    _allRecordList[_betType] = _getBetRecordListFromCacheByUser(betRecordListByUser, currentUser, _betType);
  }
  return _allRecordList;
}

function getAllBetMissionRecordByUser(currentUser) {
  let _allRecordList = {};
  for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    const _betType = Object.values(BET_TYPE)[i];
    _allRecordList[_betType] = _getBetRecordListFromCacheByUser(betMissionRecordListByUser, currentUser, _betType);
  }
  return _allRecordList;
}
function _removeAllBetRecordListToCacheByUser(cachedRecordList, currentUser, betType) {
  const cache_topic = `${currentUser.appUserId}`;
  if (cachedRecordList[betType]) {
    cachedRecordList[betType][cache_topic] = [];
  }
}

function _removeAllLiveRecordByUser(currentUser, betType) {
  if (_liveUserRecordList[betType]) {
    for (let i = 0; i < _liveUserRecordList[betType].length; i++) {
      const _liveRecord = _liveUserRecordList[betType][i];
      if (_liveRecord.appUserId === currentUser.appUserId) {
        _liveUserRecordList[betType][i] = {};
      }
    }
  }
}
function cleanAllLiveRecordByBetType(betType) {
  if (_liveUserRecordList[betType]) {
    _liveUserRecordList[betType] = [];
  }
}
async function removeAllBetRecordListByUser(currentUser, betType) {
  _removeAllBetRecordListToCacheByUser(betRecordListByUser, currentUser, betType);
  _removeAllLiveRecordByUser(currentUser, betType);

  let _realPlayData = {
    gameRecordType: betType,
    newUserPlayRecord: {},
    totalPlay: getTotalPlayOfAllRealUserFromCache(betType),
    realPlayDataList: getListOfAllRealUserPlayingFromCache(betType),
  };

  publishJSONToClient(`LIVE_USER_RECORD_${GAME_ID.BINARYOPTION}`, _realPlayData);
}

function removeAllBetMissionRecordListByUser(currentUser, betType) {
  _removeAllBetRecordListToCacheByUser(betMissionRecordListByUser, currentUser, betType);
}

async function cacheTotalBetMissionAmountInByUser(currentUser, betType, betValue, betAmountIn, gameRecordSection, appUserMissionHistoryId) {
  //TODO (nhớ xóa code tạm này)
  const cache_topic = `${currentUser.appUserId}_${betType}_${betValue}`;
  if (!totalBetMissionAmountInByUser[betType]) {
    totalBetMissionAmountInByUser[betType] = {};
  }

  if (!totalBetMissionAmountInByUser[betType][cache_topic]) {
    totalBetMissionAmountInByUser[betType][cache_topic] = {
      username: UtilFunctions.replaceCharactersToHide(currentUser.username),
      betAmountIn: 0,
      recordAmountIn: 0,
      betValue: betValue,
      gameRecordSection: gameRecordSection,
      appUserId: currentUser.appUserId,
      appUserMissionHistoryId: appUserMissionHistoryId,
    };
  }

  totalBetMissionAmountInByUser[betType][cache_topic].betAmountIn += betAmountIn;
  totalBetMissionAmountInByUser[betType][cache_topic].recordAmountIn += betAmountIn;

  //nếu hủy lệnh thì không đặt nữa
  if (totalBetMissionAmountInByUser[betType][cache_topic].betAmountIn <= 0) {
    delete totalBetMissionAmountInByUser[betType][cache_topic];
  }

  if (betAmountIn > 0) {
    await addBetRecordListToCacheByUser(
      betMissionRecordListByUser,
      currentUser,
      betType,
      betValue,
      betAmountIn,
      gameRecordSection,
      appUserMissionHistoryId,
    );
  } else {
    await removeBetRecordListToCacheByUser(betMissionRecordListByUser, currentUser, betType);
  }
}

function refreshCachedTotalBetAmountInByUser(betType) {
  totalBetAmountInByUser[betType] = {};
  _refreshCachedBetRecordListByUser(betType);
}

function _refreshCachedBetRecordListByUser(betType) {
  betRecordListByUser[betType] = [];
}
function _refreshCachedBetMissionRecordListByUser(betType) {
  betMissionRecordListByUser[betType] = {};
}

function getAllCachedTotalBetAmountInByType(betType) {
  return totalBetAmountInByUser[betType];
}

function getAllCachedTotalMissionBetAmountInByType(betType) {
  return totalBetMissionAmountInByUser[betType];
}

function getCachedTotalBetAmountInByUser(currentUser, betType) {
  let _cacheDataByUser = [];
  for (let i = 0; i < Object.keys(BET_VALUE.BINARYOPTION).length; i++) {
    const _betValue = Object.values(BET_VALUE.BINARYOPTION)[i];
    const cache_topic = `${currentUser.appUserId}_${betType}_${_betValue}`;
    if (!totalBetAmountInByUser[betType] || !totalBetAmountInByUser[betType][cache_topic]) {
      _cacheDataByUser.push({
        username: UtilFunctions.replaceCharactersToHide(currentUser.username),
        betAmountIn: 0,
        recordAmountIn: 0,
        betValue: _betValue,
      });
    } else {
      _cacheDataByUser.push({
        ...totalBetAmountInByUser[betType][cache_topic],
        betValue: _betValue,
      });
    }
  }

  return _cacheDataByUser;
}

// setInterval(() => {
//   cacheTotalBetAmountInByUser({appUserId: 1, username: "string"}, BET_TYPE.BINARYOPTION_UPDOWN_15S, BET_VALUE.BINARYOPTION.TANG, 20000, getCurrentGameSection(GAME_ID.BINARYOPTION, BET_TYPE.BINARYOPTION_UPDOWN_15S, GAME_RECORD_UNIT_BO.BTC))
// }, 3000);
async function cacheTotalBetAmountInByUser(currentUser, betType, betValue, betAmountIn, gameRecordSection) {
  // Logger.info(`cacheTotalBetAmountInByUser`)
  // if (isPlayGameRecord(gameRecordSection)) {
  //   Logger.info(` NOT isPlayGameRecord`)
  //   return;
  // }
  //TODO (nhớ xóa code tạm này)
  const cache_topic = `${currentUser.appUserId}_${betType}_${betValue}`;
  if (!totalBetAmountInByUser[betType]) {
    totalBetAmountInByUser[betType] = {};
  }

  if (!totalBetAmountInByUser[betType][cache_topic]) {
    totalBetAmountInByUser[betType][cache_topic] = {
      username: UtilFunctions.replaceCharactersToHide(currentUser.username),
      betAmountIn: 0,
      recordAmountIn: 0,
      betValue: betValue,
      gameRecordSection: gameRecordSection,
      appUserId: currentUser.appUserId,
    };
  }
  totalBetAmountInByUser[betType][cache_topic].betAmountIn += betAmountIn;
  totalBetAmountInByUser[betType][cache_topic].recordAmountIn += betAmountIn;

  if (betAmountIn > 0) {
    await addBetRecordListToCacheByUser(betRecordListByUser, currentUser, betType, betValue, betAmountIn, gameRecordSection);
  } else {
    await removeBetRecordListToCacheByUser(betRecordListByUser, currentUser, betType);
  }

  //nếu hủy lệnh thì không đặt nữa
  if (totalBetAmountInByUser[betType][cache_topic].betAmountIn <= 0) {
    delete totalBetAmountInByUser[betType][cache_topic];
  }
}

async function _cacheTotalBetAmountInByBetType(betType, betValue, betAmountIn) {
  //TODO (nhớ xóa code tạm này)
  const cache_topic = `${betType}_${betValue}`;
  if (!totalBetAmountInByBetType[cache_topic]) {
    totalBetAmountInByBetType[cache_topic] = betAmountIn;
  } else {
    totalBetAmountInByBetType[cache_topic] += betAmountIn;
  }
  publishJSONToClient(cache_topic, { totalBetAmountIn: totalBetAmountInByBetType[cache_topic] });
}

async function _cacheTotalBetAmountInByGameId(gameInfoId, betAmountIn) {
  //TODO (nhớ xóa code tạm này)
  if (!totalBetAmountInByGameId[gameInfoId]) {
    totalBetAmountInByGameId[gameInfoId] = betAmountIn;
  } else {
    totalBetAmountInByGameId[gameInfoId] += betAmountIn;
  }
  publishJSONToClient(`GAME_PLAY_INFO_${gameInfoId}`, {
    betRecordAmountIn: betAmountIn,
  });
}

async function getCachedTotalBetAmountInByGameId(gameInfoId) {
  return totalBetAmountInByGameId[gameInfoId] || 0;
}

async function getCachedTotalBetAmountInByBetType(betType, betValue) {
  const cache_topic = `${betType}_${betValue}`;
  return totalBetAmountInByBetType[cache_topic] || 0;
}

async function getCachedTotalAmountInByRoom(roomId, roomType, group) {
  switch (roomType) {
    case GAMEROOM_TYPE.LEADER:
      //phong leader
      return await _getCachedTotalAmountInLeaderRoomByRomId(roomId);
    case GAMEROOM_TYPE.DOIKHANGDON:
      //doi khang don
      if (group == GAME_GROUP.NHOMA) {
        return await _getCachedTotalAmountInLeaderAByRomId(roomId);
      } else if (group == GAME_GROUP.NHOMB) {
        return await _getCachedTotalAmountInLeaderBByRomId(roomId);
      } else {
        return await _getCachedTotalAmountInFightingRoomByRomId(roomId);
      }
    case GAMEROOM_TYPE.DOIKHANGNHOM:
      //doi khang nhom
      if (group == GAME_GROUP.NHOMA) {
        return await _getCachedTotalAmountInGroupAByRomId(roomId);
      } else if (group == GAME_GROUP.NHOMB) {
        return await _getCachedTotalAmountInGroupBByRomId(roomId);
      } else {
        return await _getCachedTotalAmountInGroupFightingRoomByRomId(roomId);
      }
  }
  return 0;
}

async function getCachedTotalAmountWinByRoom(roomId, roomType) {
  switch (roomType) {
    case GAMEROOM_TYPE.LEADER:
      //phong leader
      return await _getCachedTotalAmountWinRoomLeaderByRomId(roomId);
    case GAMEROOM_TYPE.DOIKHANGDON:
      //doi khang don
      return await _getCachedTotalAmountWinRoomFightingByRomId(roomId);
    case GAMEROOM_TYPE.DOIKHANGNHOM:
      //doi khang nhom
      return await _getCachedTotalAmountWinRoomGroupFightingByRomId(roomId);
  }
  return 0;
}

async function getCurrentBetSection(sectionName, betType) {
  let gameRecordType;
  let _order = {
    key: 'gameRecordSection',
    value: 'asc',
  };
  gameRecordType = _getGameRecordTypeFromName(betType);
  let gameRecord = await GameRecordsResourceAccess.find(
    {
      gameRecordType: gameRecordType || betType,
      gameRecordSection: sectionName,
      gameRecordStatus: GAME_RECORD_STATUS.PENDING,
      isPlayGameRecord: 1,
    },
    0,
    1,
    _order,
  );

  if (gameRecord && gameRecord.length > 0) {
    return gameRecord[0];
  }

  return undefined;
}

async function _notifyLiveRecord(betRecord, username) {
  let _usernamePlay = '';
  if (username) {
    _usernamePlay = username;
  } else {
    let _user = await AppUsersResourceAccess.findById(betRecord.appUserId);
    _usernamePlay = utilFunctions.replaceCharactersToHide(_user.username);
  }
  let gameInfoId = GAME_ID.BINARYOPTION;
  if (betRecord.gameInfoId) {
    gameInfoId = betRecord.gameInfoId;
  }
  publishJSONToClient(`LIVE_RECORD_${gameInfoId}`, {
    username: _usernamePlay,
    ...betRecord,
  });
}

let _liveUserRecordList = {};
function _addRealUserPlayRecordToCache(betRecord) {
  if (!_liveUserRecordList[betRecord.betRecordType]) {
    _liveUserRecordList[betRecord.betRecordType] = [];
  }
  _liveUserRecordList[betRecord.betRecordType].push(betRecord);
}

function getTotalPlayOfAllRealUserFromCache(betRecordType) {
  let _totalPlay = {};
  for (let i = 0; i < Object.values(BET_VALUE.BINARYOPTION).length; i++) {
    const _betValue = Object.values(BET_VALUE.BINARYOPTION)[i];
    _totalPlay[_betValue] = 0;
  }

  let _realUserPlayListByType = _liveUserRecordList[betRecordType];
  if (_realUserPlayListByType && _realUserPlayListByType.length > 0) {
    _realUserPlayListByType.forEach(_userPlayRecord => {
      _totalPlay[_userPlayRecord.betRecordValue] += _userPlayRecord.betRecordAmountIn * 1;
    });
  }
  return _totalPlay;
}
function getListOfAllRealUserPlayingFromCache(betRecordType) {
  let _listUserPlaying = [];

  let _realUserPlayListByType = _liveUserRecordList[betRecordType];
  _listUserPlaying = sumAmountInByUserId(_realUserPlayListByType);

  return _listUserPlaying;
}

function sumAmountInByUserId(recordArray) {
  const sumByUserId = {};
  if (recordArray) {
    // Iterate through the array and calculate the sum for each userId
    for (let i = 0; i < recordArray.length; i++) {
      const item = recordArray[i];
      const { appUserId, betRecordAmountIn } = item;

      // If the userId doesn't exist in sumByUserId, initialize it with the current amountIn
      if (!sumByUserId[appUserId]) {
        sumByUserId[appUserId] = {
          appUserId: appUserId,
          username: item.username,
          totalPlayAmount: betRecordAmountIn,
          totalPlay: {},
        };
        sumByUserId[appUserId].totalPlay[item.betRecordValue] = betRecordAmountIn;
      } else {
        sumByUserId[appUserId].totalPlayAmount += betRecordAmountIn;
        sumByUserId[appUserId].totalPlay[item.betRecordValue] += betRecordAmountIn;
      }
    }
  }

  // Sort the array by totalPlayAmount in descending order
  let _displayListUserPlaying = [];
  for (let i = 0; i < Object.values(sumByUserId).length; i++) {
    const _playingRecord = Object.values(sumByUserId)[i];
    _displayListUserPlaying.push(_playingRecord);
  }
  _displayListUserPlaying.sort((a, b) => b.totalPlayAmount - a.totalPlayAmount);

  return _displayListUserPlaying;
}

async function _notifyRealUserLiveRecord(betRecord, currentUser) {
  let _usernamePlay = '';
  if (currentUser) {
    _usernamePlay = currentUser.username;
  }

  if (betRecord.gameInfoId) {
    gameInfoId = betRecord.gameInfoId;
  }
  let _userPlayRecord = {
    username: _usernamePlay,
    ...betRecord,
  };

  _addRealUserPlayRecordToCache(_userPlayRecord);
}

async function botPlaceNewBet(betRecordFake) {
  if (!betRecordFake) {
    return;
  }
  if (checkIfNowisPlayGameRecord(betRecordFake.betRecordType) === false) {
    return;
  }
  const gameInfoId = GAME_ID.BINARYOPTION;
  let _index = 0;
  if (betRecordFake.betRecordAmountIn % 7 === 0) {
    _index = UtilFunctions.randomIntByMinMax(1, 7);
  } else if (betRecordFake.betRecordAmountIn % 9 === 0) {
    _index = UtilFunctions.randomIntByMinMax(1, 9);
  }
  let _fakerName = UtilFunctions.generateFakerUsername();
  if (_index !== 0) {
    _fakerName = _fakerName.split('');
    _fakerName.pop();
    _fakerName = _fakerName.join('');
    _fakerName += `${_index}`;
  }
  await Promise.all([
    _notifyLiveRecord(betRecordFake, _fakerName),
    _cacheTotalBetAmountInByBetType(betRecordFake.betRecordType, betRecordFake.betPlace, betRecordFake.betAmountIn),
    _cacheTotalBetAmountInByGameId(gameInfoId, betRecordFake.betAmountIn),
  ]);
}

function makeGamePlayHash(gamePlayRecord) {
  let _hash = `${gamePlayRecord.betRecordSection}_${gamePlayRecord.appUserId}_${gamePlayRecord.betRecordValue}_${gamePlayRecord.betRecordUnit}_${gamePlayRecord.betRecordType}__${gamePlayRecord.gameInfoId}`;
  return _hash;
}
async function _placeNewBet(
  user,
  betRecordAmountIn,
  betRecordValue,
  sectionName,
  wallet,
  betType,
  betUnit,
  gamePlayCategory = GAME_PLAY_CATEGORY.NORMAL,
  appUserMissionHistoryId,
  createdAt,
) {
  //check wallet balance
  if (wallet.balance * 1 < betRecordAmountIn * 1) {
    Logger.error(`not enough balance to _placeNewBet`);
    return undefined;
  }

  //create new record data
  let newBetData = {
    appUserId: user.appUserId,
    betRecordAmountIn: betRecordAmountIn,
    betRecordValue: betRecordValue,
    walletId: wallet.walletId,
    betRecordType: betType,
    betRecordUnit: betUnit,
    betRecordSection: sectionName,
    gameInfoId: GAME_ID.BINARYOPTION,
    createdAt: createdAt,
  };

  newBetData.betRecordHash = makeGamePlayHash(newBetData);

  let _needToDecreaseWalletType = WALLET_TYPE.POINT;
  let _needToDecreaseWalletRecordType = WALLET_RECORD_TYPE.PLAY_GAME;
  if (gamePlayCategory === GAME_PLAY_CATEGORY.NORMAL) {
    _needToDecreaseWalletType = WALLET_TYPE.POINT;
    _needToDecreaseWalletRecordType = WALLET_RECORD_TYPE.PLAY_GAME;
  } else if (gamePlayCategory === GAME_PLAY_CATEGORY.FAKE) {
    _needToDecreaseWalletType = WALLET_TYPE.FAKE;
    _needToDecreaseWalletRecordType = WALLET_RECORD_TYPE.PLAY_GAME;
  } else if (gamePlayCategory === GAME_PLAY_CATEGORY.MISSION) {
    if (appUserMissionHistoryId) {
      newBetData.appUserMissionHistoryId = appUserMissionHistoryId;
    } else {
      Logger.error(`invalid appUserMissionHistoryId when _placeNewBet`);
      return undefined;
    }
    _needToDecreaseWalletType = WALLET_TYPE.MISSION;
    _needToDecreaseWalletRecordType = WALLET_RECORD_TYPE.PLAY_GAME_MISSION;
  }

  let decrementResult = await WalletRecordFunctions.decreaseBalance(
    user.appUserId,
    _needToDecreaseWalletType,
    _needToDecreaseWalletRecordType,
    betRecordAmountIn,
  );
  if (!decrementResult) {
    Logger.error(`failed to decrease balance when _placeNewBet`);
    return undefined;
  }

  let newBetResult;
  if (gamePlayCategory === GAME_PLAY_CATEGORY.NORMAL) {
    newBetResult = await GamePlayRecordsResource.insert(newBetData);
  } else if (gamePlayCategory === GAME_PLAY_CATEGORY.FAKE) {
    newBetResult = await BetRecordFakeResourceAccess.insert(newBetData);
  } else if (gamePlayCategory === GAME_PLAY_CATEGORY.MISSION) {
    newBetResult = await AppUserMissionPlayResourceAccess.insert(newBetData);
  }

  if (!newBetResult) {
    Logger.error(`failed to _placeNewBet`);
  }

  let _newBetRecord = undefined;
  if (gamePlayCategory === GAME_PLAY_CATEGORY.NORMAL) {
    _newBetRecord = await GamePlayRecordsResource.findById(newBetResult[0]);
  } else if (gamePlayCategory === GAME_PLAY_CATEGORY.FAKE) {
    _newBetRecord = await BetRecordFakeResourceAccess.findById(newBetResult[0]);
  } else if (gamePlayCategory === GAME_PLAY_CATEGORY.MISSION) {
    _newBetRecord = await AppUserMissionPlayResourceAccess.findById(newBetResult[0]);
    let _filter = {
      appUserId: user.appUserId,
    };
    if (appUserMissionHistoryId) {
      _filter.appUserMissionHistoryId = appUserMissionHistoryId;
    }
    const playCount = await AppUserMissionPlayResourceAccess.customCount(_filter, moment().startOf('day').format(), moment().endOf('day').format());
    if (playCount && playCount.length > 0) {
      //cộng lượt làm nhiệm vụ
      const AppUserMissionHistoryResourceAccess = require('../AppUserMission/resourceAccess/AppUserMissionHistoryResourceAccess');
      const appUserMissionHistory = await AppUserMissionHistoryResourceAccess.findById(appUserMissionHistoryId);
      if (appUserMissionHistory && appUserMissionHistory.missionStatus === MISSION_STATUS.NEW) {
        await AppUserMissionHistoryResourceAccess.updateById(user.appUserId, {
          missionStatus: MISSION_STATUS.IN_PROGRESS,
        });
      }
    }
  }

  if (_newBetRecord) {
    await Promise.all([
      _cacheAmountByUserAndRoom(user.appUserId, betRecordAmountIn),
      // _notifyRealUserLiveRecord({ ..._newBetRecord, betRecordUnit: GAME_RECORD_UNIT_BO.BTC }),
    ]);
  }

  return newBetResult;
}

async function placeUserBet(user, betRecordAmountIn, betRecordValue, sectionName, betType, betUnit, isVirtualUser, createdAt) {
  if (!user || user.appUserId < 1) {
    Logger.error('null userid can not place bet');
    return undefined;
  }

  if (!betRecordValue || betRecordValue.split(/;/).length < 1) {
    Logger.error('invalid betRecordValue can not place bet');
    return undefined;
  }

  if (UtilFunctions.isNotEmptyStringValue(sectionName) === false) {
    const gameSections = getCurrentGameSection(GAME_ID.BINARYOPTION, betType, betUnit);

    if (gameSections) {
      sectionName = gameSections;
    } else {
      Logger.error('null sectionName can not place bet');
      return undefined;
    }
  }

  let _gamePlayCategory = GAME_PLAY_CATEGORY.NORMAL;
  let _walletTypeToPlay = WALLET_TYPE.POINT;
  if (isVirtualUser) {
    _gamePlayCategory = GAME_PLAY_CATEGORY.FAKE;
    _walletTypeToPlay = WALLET_TYPE.FAKE;
  }

  let wallet = await getWalletByType(user.appUserId, _walletTypeToPlay);
  if (!wallet) {
    Logger.error('can not find wallet to placeNewBet');
    return undefined;
  }

  let betResult = await _placeNewBet(user, betRecordAmountIn, betRecordValue, sectionName, wallet, betType, betUnit, _gamePlayCategory, createdAt);
  publishJSONToClient(`UPDATE_USER_${user.appUserId}`);
  return betResult;
}

async function placeUserMissionBet(user, betRecordAmountIn, betRecordValue, sectionName, betType, betUnit, appUserMissionHistoryId, createdAt) {
  if (!user || user.appUserId < 1) {
    Logger.error('null userid can not place bet');
    return undefined;
  }

  if (!betRecordValue || betRecordValue.split(/;/).length < 1) {
    Logger.error('invalid betRecordValue can not place bet');
    return undefined;
  }

  if (UtilFunctions.isNotEmptyStringValue(sectionName) === false) {
    const gameSections = getCurrentGameSection(GAME_ID.BINARYOPTION, betType, betUnit);

    if (gameSections) {
      sectionName = gameSections;
    } else {
      Logger.error('null sectionName can not place bet');
      return undefined;
    }
  }

  let _gamePlayCategory = GAME_PLAY_CATEGORY.MISSION;
  let _walletTypeToPlay = WALLET_TYPE.MISSION;

  let wallet = await getWalletByType(user.appUserId, _walletTypeToPlay);
  if (!wallet) {
    Logger.error('can not find wallet to placeNewBet');
    return undefined;
  }

  let _betResult = await _placeNewBet(
    user,
    betRecordAmountIn,
    betRecordValue,
    sectionName,
    wallet,
    betType,
    betUnit,
    _gamePlayCategory,
    appUserMissionHistoryId,
    createdAt,
  );
  publishJSONToClient(`UPDATE_USER_${user.appUserId}`);
  return _betResult;
}

async function placeUserBetTemp(user, betRecordAmountIn, betRecordValue, betType, betUnit, gameRecordSection) {
  try {
    const betRecordFake = {
      betRecordAmountIn: betRecordAmountIn,
      betRecordValue: betRecordValue,
      betPlace: betRecordValue, //field ao
      betRecordType: betType,
      betRecordUnit: GAME_RECORD_UNIT_BO.BTC,
      appUserId: user.appUserId,
      createdAt: new Date(),
    };

    let realPlayDataTotalPlay = getTotalPlayOfAllRealUserFromCache(betRecordFake.betRecordType);

    if (betRecordValue == 'TANG' && realPlayDataTotalPlay.TANG + betRecordAmountIn > BET_AMOUNT_MAX) {
      return PLACE_RECORD_ERROR.ERR_BET_AMOUNT_MAX;
    }
    if (betRecordValue == 'GIAM' && realPlayDataTotalPlay.GIAM + betRecordAmountIn > BET_AMOUNT_MAX) {
      return PLACE_RECORD_ERROR.ERR_BET_AMOUNT_MAX;
    }

    await Promise.all([
      _cacheTotalBetAmountInByBetType(betType, betRecordValue, betRecordAmountIn),
      _cacheTotalBetAmountInByGameId(GAME_ID.BINARYOPTION, betRecordAmountIn),
      cacheTotalBetAmountInByUser(user, betType, betRecordValue, betRecordAmountIn, gameRecordSection),
      _notifyLiveRecord(betRecordFake, UtilFunctions.replaceCharactersToHide(user.firstName)),
      _notifyRealUserLiveRecord({ ...betRecordFake, betRecordUnit: GAME_RECORD_UNIT_BO.BTC }, user),
    ]);

    let _realPlayData = {
      gameRecordType: betRecordFake.betRecordType,
      newUserPlayRecord: betRecordFake,
      totalPlay: getTotalPlayOfAllRealUserFromCache(betRecordFake.betRecordType),
      realPlayDataList: getListOfAllRealUserPlayingFromCache(betRecordFake.betRecordType),
    };

    publishJSONToClient(`LIVE_USER_RECORD_${GAME_ID.BINARYOPTION}`, _realPlayData);

    let result = {
      AmountByType: await getCachedTotalBetAmountInByBetType(betType, betRecordValue),
      AmountByGameId: await getCachedTotalBetAmountInByGameId(GAME_ID.BINARYOPTION),
    };

    return result;
  } catch (error) {
    Logger.error(error);
    Logger.error(`fail to placeUserBetTemp with error: `);
    return null;
  }
}

async function placeUserMissionTemp(user, betRecordAmountIn, betRecordValue, betType, betUnit, gameRecordSection, appUserMissionHistoryId) {
  try {
    const betRecordFake = {
      betRecordAmountIn: betRecordAmountIn,
      betRecordValue: betRecordValue,
      betPlace: betRecordValue, //field ao
      betRecordType: betType,
      betRecordUnit: GAME_RECORD_UNIT_BO.BTC,
      appUserId: user.appUserId,
      createdAt: new Date(),
      appUserMissionHistoryId: appUserMissionHistoryId,
    };

    const gameInfoId = GAME_ID.BINARYOPTION;
    await Promise.all([
      _cacheTotalBetAmountInByBetType(betType, betRecordValue, betRecordAmountIn),
      _cacheTotalBetAmountInByGameId(gameInfoId, betRecordAmountIn),
      cacheTotalBetMissionAmountInByUser(user, betType, betRecordValue, betRecordAmountIn, gameRecordSection, appUserMissionHistoryId),
      _notifyLiveRecord(betRecordFake, UtilFunctions.replaceCharactersToHide(user.firstName)),
    ]);

    let result = {
      AmountByType: await getCachedTotalBetAmountInByBetType(betType, betRecordValue),
      AmountByGameId: await getCachedTotalBetAmountInByGameId(gameInfoId),
    };
    return result;
  } catch (error) {
    Logger.error(error);
    Logger.error(`fail to placeUserBetTemp with error: `);
    return null;
  }
}

async function updateWinLoseForMission(missionPlayRecord, winAmount) {
  //cập nhật game play record
  let betResult = BET_RESULT.WIN;
  let betAmountWin = 0;
  let betAmountOut = 0;
  if (winAmount > 0) {
    betAmountWin = winAmount;
    betAmountOut = winAmount + missionPlayRecord.betRecordAmountIn;
  } else if (winAmount == 0) {
    betResult = BET_RESULT.HOA;
    betAmountOut = missionPlayRecord.betRecordAmountIn;
  } else if (winAmount < 0) {
    betResult = BET_RESULT.LOSE;
    betAmountWin = -missionPlayRecord.betRecordAmountIn;
  }
  let updatedRecord = await AppUserMissionPlayResourceAccess.updateById(missionPlayRecord.betRecordId, {
    betRecordResult: betResult,
    betRecordStatus: BET_STATUS.COMPLETED,
    betRecordAmountOut: betAmountOut,
    betRecordWin: betAmountWin,
  });

  if (updatedRecord !== undefined) {
    if (betResult == BET_RESULT.LOSE) {
      betAmountOut = -missionPlayRecord.betRecordAmountIn; //tiền thua
    }
    await cacheWinLoseMissionAmountByUser(missionPlayRecord, missionPlayRecord.betRecordType, betAmountOut);

    //cộng tiền vào ví
    if (betAmountOut > 0) {
      await WalletRecordFunctions.increaseBalance(
        missionPlayRecord.appUserId,
        WALLET_TYPE.MISSION,
        WALLET_RECORD_TYPE.PLAY_MISSION_WIN,
        betAmountOut,
      );
    }
  } else {
    Logger.error(
      `[UpdateWinLoseForBetGame_Fail]: ${missionPlayRecord.betRecordId} | ${missionPlayRecord.betRecordSection} - Error to update game play records`,
    );
  }
}

async function updateWinLoseForBetGame(gamePlayRecord, winAmount) {
  //cập nhật game play record
  let betResult = BET_RESULT.WIN;
  let betAmountWin = 0;
  let betAmountOut = 0;
  if (winAmount > 0) {
    betAmountWin = winAmount;
    betAmountOut = winAmount + gamePlayRecord.betRecordAmountIn;
  } else if (winAmount == 0) {
    betResult = BET_RESULT.HOA;
    betAmountOut = gamePlayRecord.betRecordAmountIn;
  } else if (winAmount < 0) {
    betResult = BET_RESULT.LOSE;
    betAmountWin = -gamePlayRecord.betRecordAmountIn;
  }
  let updatedRecord = await GamePlayRecordsResource.updateById(gamePlayRecord.betRecordId, {
    betRecordResult: betResult,
    betRecordStatus: BET_STATUS.COMPLETED,
    betRecordAmountOut: betAmountOut,
    betRecordWin: betAmountWin,
  });
  if (updatedRecord) {
    //cộng tiền vào ví
    await _addWiningPaymentForUser(gamePlayRecord.appUserId, betAmountOut, gamePlayRecord.betRecordId, betResult);

    //thông báo đến user
    if (betResult == BET_RESULT.LOSE) {
      betAmountOut = -gamePlayRecord.betRecordAmountIn; //tiền thua
    }
    await cacheWinLoseAmountByUser(gamePlayRecord, gamePlayRecord.betRecordType, betAmountOut);
  } else {
    Logger.error(
      `[UpdateWinLoseForBetGame_Fail]: ${gamePlayRecord.betRecordId} | ${gamePlayRecord.betRecordSection} - Error to update game play records`,
    );
  }
}

// try {
// } catch (error) {}
// cacheWinLoseAmountByUser(
//   {
//     betRecordValue: 'TANG',
//     appUserId: 30,
//     betRecordAmountIn: 50000,
//   },
//   BET_TYPE.BINARYOPTION_UPDOWN_15S,
//   95000,
// ).then(() => {
//   pushNotificationBetGameResult(BET_TYPE.BINARYOPTION_UPDOWN_15S);
// });

async function cacheWinLoseAmountByUser(gamePlayRecord, gameRecordType, outAmount) {
  const keyWinlose = `WINLOSE_${gamePlayRecord.appUserId}_${gameRecordType}_${gamePlayRecord.betRecordValue}`; //cache tiền thắng thua theo cửa
  const keyPlayAmount = `PLAYAMOUNT_${gamePlayRecord.appUserId}_${gameRecordType}_${gamePlayRecord.betRecordValue}`; //cache tiền chơi theo cửa
  const userPlaykey = `WINLOSE_${gamePlayRecord.appUserId}_${gameRecordType}`; //cache ID người chơi

  if (!userPlayWinAmount[keyWinlose]) {
    userPlayWinAmount[keyWinlose] = 0;
  }
  userPlayWinAmount[keyWinlose] += outAmount;

  if (!userPlayWinAmount[keyPlayAmount]) {
    userPlayWinAmount[keyPlayAmount] = 0;
  }
  userPlayWinAmount[keyPlayAmount] += gamePlayRecord.betRecordAmountIn;

  //luu lai key de tong hop
  if (!userPlayKeys.includes(userPlaykey)) {
    userPlayKeys.push(userPlaykey);
  }
}
async function cacheWinLoseMissionAmountByUser(gamePlayRecord, gameRecordType, outAmount) {
  const keyWinlose = `WINLOSE_MISSION_${gamePlayRecord.appUserId}_${gameRecordType}_${gamePlayRecord.betRecordValue}`; //cache tiền thắng thua theo cửa
  const keyPlayAmount = `PLAYAMOUNT_MISSION_${gamePlayRecord.appUserId}_${gameRecordType}_${gamePlayRecord.betRecordValue}`; //cache tiền chơi theo cửa
  const userPlaykey = `WINLOSE_MISSION_${gamePlayRecord.appUserId}_${gameRecordType}`; //cache ID người chơi

  if (!userPlayMissionWinAmount[keyWinlose]) {
    userPlayMissionWinAmount[keyWinlose] = 0;
  }
  userPlayMissionWinAmount[keyWinlose] += outAmount;

  if (!userPlayMissionWinAmount[keyPlayAmount]) {
    userPlayMissionWinAmount[keyPlayAmount] = 0;
  }
  userPlayMissionWinAmount[keyPlayAmount] += gamePlayRecord.betRecordAmountIn;

  //luu lai key de tong hop
  if (!userPlayMissionKeys.includes(userPlaykey)) {
    userPlayMissionKeys.push(userPlaykey);
  }
}
async function pushNotificationBetGameResult(gameRecordType) {
  let pushNotiList = [];
  const { updateTotalPlayForUser } = require('../LeaderBoard/LeaderFunction');
  for (let index = 0; index < userPlayKeys.length; index++) {
    const appUserId = userPlayKeys[index].split('_')[1];
    let _winloseTANG = userPlayWinAmount[`WINLOSE_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.TANG}`] || 0; //tiền thắng/thua cửa tăng
    let _playTANG = userPlayWinAmount[`PLAYAMOUNT_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.TANG}`] || 0; //tiền chơi cửa tăng
    let _winloseGIAM = userPlayWinAmount[`WINLOSE_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.GIAM}`] || 0; //tiền thắng/thua cửa giảm
    let _playGIAM = userPlayWinAmount[`PLAYAMOUNT_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.GIAM}`] || 0; //tiền chơi cửa giảm
    const outAmount = _calculateWinLoseAmount(_playTANG, _playGIAM, _winloseTANG, _winloseGIAM);
    let result = outAmount > 0 ? 'WIN' : 'LOSE';
    if ((_playTANG > 0 && _playTANG == _winloseTANG) || (_playGIAM > 0 && _playGIAM == _winloseGIAM)) {
      result = 'HOA';
    }
    publishJSONToClient(`USER_${appUserId}`, {
      when: new Date() - 1,
      amount: outAmount,
      result: result,
      betRecordType: gameRecordType,
    });
    pushNotiList.push(updateTotalPlayForUser(appUserId));
  }
  await Promise.all(pushNotiList)
    .then(res => {
      //reset lai key va winamount cua van choi
      userPlayKeys = [];
      userPlayWinAmount = {};
    })
    .catch(error => Logger.error(`${new Date()}-[Error]: Push noti win/lose binaryoption up/down game record error`, error));
}
async function pushNotificationMissionBetGameResult(gameRecordType) {
  let pushNotiList = [];
  for (let index = 0; index < userPlayMissionKeys.length; index++) {
    const appUserId = userPlayMissionKeys[index].split('_')[2];
    let _winloseTANG = userPlayMissionWinAmount[`WINLOSE_MISSION_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.TANG}`] || 0; //tiền thắng/thua cửa tăng
    let _playTANG = userPlayMissionWinAmount[`PLAYAMOUNT_MISSION_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.TANG}`] || 0; //tiền chơi cửa tăng
    let _winloseGIAM = userPlayMissionWinAmount[`WINLOSE_MISSION_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.GIAM}`] || 0; //tiền thắng/thua cửa giảm
    let _playGIAM = userPlayMissionWinAmount[`PLAYAMOUNT_MISSION_${appUserId}_${gameRecordType}_${BET_VALUE.BINARYOPTION.GIAM}`] || 0; //tiền chơi cửa giảm
    const outAmount = _calculateWinLoseAmount(_playTANG, _playGIAM, _winloseTANG, _winloseGIAM);
    let result = outAmount > 0 ? 'WIN' : 'LOSE';
    if ((_playTANG > 0 && _playTANG == _winloseTANG) || (_playGIAM > 0 && _playGIAM == _winloseGIAM)) {
      result = 'HOA';
    }
    publishJSONToClient(`USER_MISSION_${appUserId}`, {
      when: new Date() - 1,
      amount: outAmount,
      result: result,
      betRecordType: gameRecordType,
    });
  }
  await Promise.all(pushNotiList)
    .then(res => {
      //reset lai key va winamount cua van choi
      userPlayMissionKeys = [];
      userPlayMissionWinAmount = {};
    })
    .catch(error => Logger.error(`${new Date()}-[Error]: Push noti win/lose binaryoption up/down game record error`, error));
}

function _calculateWinLoseAmount(playTangAmount, playGiamAmount, winloseTang, winloseGiam) {
  if (playTangAmount > 0 && playGiamAmount == 0) {
    //đặt 1 cửa tăng
    return winloseTang;
  } else if (playGiamAmount > 0 && playTangAmount == 0) {
    //đặt 1 cửa giảm
    return winloseGiam;
  } else if (playTangAmount > 0 && playGiamAmount > 0) {
    //đặt 2 cửa
    if (winloseTang > 0 && winloseGiam < 0) {
      //cửa tăng thắng
      return winloseTang - playTangAmount + winloseGiam;
    } else if (winloseGiam > 0 && winloseTang < 0) {
      //cửa giảm thắng
      return winloseGiam - playGiamAmount + winloseTang;
    }
    return 0;
  }
  return 0;
}

function _matchGameSectionsWithBet(betRecordSection, gameSections) {
  const MATCHED = 1;
  const NOT_MATCHED = 0;
  for (let i = 0; i < gameSections.length; i++) {
    const _section = gameSections[i];
    if (_section.sectionName !== betRecordSection.sectionName) {
      return MATCHED;
    }
  }
  return NOT_MATCHED;
}

async function _addWiningPaymentForUser(appUserId, winAmount, betRecordId, betResult) {
  if (winAmount <= 0) {
    //chi tra tien hoa hong dua tren so tien thang duoc
    Logger.error(`invalid amount ${winAmount} to _addWiningPaymentForUser`);
    return;
  }
  let walletRecordType = WALLET_RECORD_TYPE.PLAY_WIN;
  if (betResult == BET_RESULT.HOA) {
    walletRecordType = WALLET_RECORD_TYPE.REFUND;
  }
  //+ số dư và tạo giao dịch
  return await WalletRecordFunctions.increaseBalance(
    appUserId,
    WALLET_TYPE.POINT,
    walletRecordType,
    winAmount,
    undefined,
    undefined,
    undefined,
    betRecordId,
  );
}

async function _increaseBonusPaymentForUser(appUserId, referUserId, bonusAmount, supervisorId, level = 0, totalPlayAmount) {
  if (bonusAmount <= 0) {
    //chi tra tien hoa hong dua tren so tien thang duoc
    Logger.error(`invalid amount ${bonusAmount} to _increaseBonusPaymentForUser`);
    return;
  }
  //tao giao dich huong hoa hong
  let _newTransactionData = {
    appUserId: appUserId,
    referUserId: referUserId,
    paymentAmount: bonusAmount,
    paymentStatus: BONUS_TRX_STATUS.COMPLETED,
    paymentNote: `BONUS_FROM_USER_${referUserId}`,
    totalReferAmount: totalPlayAmount,
    paymentDate: moment().format('YYYY/MM/DD'),
  };
  if (level > 0 && level <= 10) {
    _newTransactionData[`paymentAmountF${level}`] = bonusAmount;
  }

  const insertBonusTrx = await PaymentBonusTransactionResourceAccess.insert(_newTransactionData);
  if (insertBonusTrx) {
    //check supervisor
    let staff = undefined;
    if (supervisorId) {
      staff = await StaffResourceAccess.findById(supervisorId);
    }
    await WalletRecordFunctions.increaseBalance(
      appUserId,
      WALLET_TYPE.BONUS,
      WALLET_RECORD_TYPE.REFER_BONUS,
      bonusAmount,
      staff,
      `BONUS_TRX_${insertBonusTrx[0]}`,
    );
  }
}

async function _addBonusPaymentForReferUserByLevel(appUserId, playUserId, supervisorId, totalPlayAmount, level = 0) {
  if (UtilFunctions.isValidValue(appUserId) && level > 0) {
    const _user = await AppUsersResourceAccess.findById(appUserId);
    if (_user && _user.appUserMembershipId > 0) {
      const AppUserMembershipResourceAccess = require('../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
      let _membership = await AppUserMembershipResourceAccess.findById(_user.appUserMembershipId);
      if (_membership && UtilFunctions.isValidValue(_membership[`appUserMembershipBonusRateF${level}`])) {
        const bonusAmount = (totalPlayAmount * _membership[`appUserMembershipBonusRateF${level}`]) / 100;

        await _increaseBonusPaymentForUser(appUserId, playUserId, bonusAmount, supervisorId, level, totalPlayAmount);
      }
    }
  }
}

//chi tra tien hoa hong dua tren so tien thang duoc
async function addBonusPaymentForReferUser(appUserId, playAmount) {
  Logger.info(`addBonusPaymentForReferUser appUserId ${appUserId} playAmount ${playAmount}`);
  if (playAmount <= 0) {
    //chi tra tien hoa hong dua tren so tien thang duoc
    Logger.error(`invalid amount ${playAmount} to _addBonusPaymentForReferUser`);
    return;
  }

  let _currentUser = await AppUsersResourceAccess.findById(appUserId);
  if (!_currentUser) {
    Logger.error(`invalid user ${appUserId} to _addBonusPaymentForReferUser`);
    return;
  }

  await Promise.all([
    _addBonusPaymentForReferUserByLevel(_currentUser.memberReferIdF1, _currentUser.appUserId, _currentUser.supervisorId, playAmount, 1),
    _addBonusPaymentForReferUserByLevel(_currentUser.memberReferIdF2, _currentUser.appUserId, _currentUser.supervisorId, playAmount, 2),
    _addBonusPaymentForReferUserByLevel(_currentUser.memberReferIdF3, _currentUser.appUserId, _currentUser.supervisorId, playAmount, 3),
    _addBonusPaymentForReferUserByLevel(_currentUser.memberReferIdF4, _currentUser.appUserId, _currentUser.supervisorId, playAmount, 4),
    _addBonusPaymentForReferUserByLevel(_currentUser.memberReferIdF5, _currentUser.appUserId, _currentUser.supervisorId, playAmount, 5),
    _addBonusPaymentForReferUserByLevel(_currentUser.memberReferIdF6, _currentUser.appUserId, _currentUser.supervisorId, playAmount, 6),
  ]);
}

async function sumBetRecordBonusForUser(appUserId) {
  let totalBonus = await GamePlayRecordsResource.sum('betRecordAmountIn', {
    appUserId: appUserId,
    betRecordStatus: BET_STATUS.COMPLETED,
    betRecordPaymentBonusStatus: BET_STATUS.NEW,
  });

  if (totalBonus && totalBonus.length > 0) {
    return totalBonus[0].sumResult;
  } else {
    return 0;
  }
}

async function updateAllBonusPaymentStatusByUser(appUserId) {
  let updateResult = await GamePlayRecordsResource.updateAll(
    {
      betRecordPaymentBonusStatus: BET_STATUS.COMPLETED,
    },
    {
      appUserId: appUserId,
      betRecordPaymentBonusStatus: BET_STATUS.NEW,
    },
  );
  if (updateResult) {
    return updateResult;
  } else {
    return undefined;
  }
}
async function getCommissionRate(appUserId) {
  let result = await AppUser.findById(appUserId);
  // phần trăm hoa hồng
  if (result) {
    if (result.appUserMembershipId === LEVER_MEMBERSHIP.MEMBER) {
      return {
        appUserMembershipId: LEVER_MEMBERSHIP.MEMBER,
        F1: 0.1,
        F2: 0.08,
        F3: 0.05,
      };
    }
    if (result.appUserMembershipId === LEVER_MEMBERSHIP.BUSINESS) {
      return {
        appUserMembershipId: LEVER_MEMBERSHIP.BUSINESS,
        F1: 0.15,
        F2: 0.08,
        F3: 0.05,
      };
    }
    if (result.appUserMembershipId === LEVER_MEMBERSHIP.COMPANY) {
      return {
        appUserMembershipId: LEVER_MEMBERSHIP.COMPANY,
        F1: 0.2,
        F2: 0.08,
        F3: 0.05,
      };
    }
    if (result.appUserMembershipId === LEVER_MEMBERSHIP.ENTERPRISE) {
      return {
        appUserMembershipId: LEVER_MEMBERSHIP.ENTERPRISE,
        F1: 0.25,
        F2: 0.08,
        F3: 0.05,
      };
    }
    if (result.appUserMembershipId === LEVER_MEMBERSHIP.CORPORATION) {
      return {
        appUserMembershipId: LEVER_MEMBERSHIP.CORPORATION,
        F1: 0.3,
        F2: 0.08,
        F3: 0.05,
      };
    }
    if (result.appUserMembershipId === undefined || result.appUserMembershipId === null || result.appUserMembershipId === '') {
      return {
        F1: 0,
        F2: 0,
        F3: 0,
      };
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

async function _payCommissionForUser(user, amount) {
  let wallet = await WalletResource.find({
    appUserId: user.appUserId,
    walletType: WALLET_TYPE.BTC,
  });

  if (!wallet || wallet.length < 1) {
    Logger.error(`_payCommissionForUser user wallet is invalid ${user.appUserId}`);
    return undefined;
  }
  wallet = wallet[0];
  let historyData = {
    appUserId: user.appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance + amount,
    WalletRecordType: WALLET_RECORD_TYPE.REFER_BONUS,
  };
  let resultIncrement = await WalletResource.incrementBalance(wallet.walletId, amount);
  if (resultIncrement) {
    let result = await WalletRecordResourAccess.insert(historyData);
    if (result) {
      return result;
    } else {
      Logger.error('insert deposit transaction error');
      return undefined;
    }
  } else {
    Logger.error('increment error');
    return undefined;
  }
}

async function payCommissionForReferalByUserId(appUserId, amount) {
  return new Promise(async (resolve, reject) => {
    try {
      let resultUser = await AppUser.findById(appUserId);
      if (resultUser) {
        if (resultUser.memberReferIdF1 !== null) {
          let apppUserIdF1 = resultUser.memberReferIdF1;
          let result = await getCommissionRate(apppUserIdF1);
          if (result) {
            let amountF1 = amount * result.F1;
            let resultBonus = await _payCommissionForUser(apppUserIdF1, amountF1);
            if (!resultBonus) {
              reject('Bonus FAC F1 failed');
            }
          } else {
            reject('Can not get commission rate');
          }
        }
        if (resultUser.memberReferIdF2 !== null) {
          let apppUserIdF2 = resultUser.memberReferIdF2;
          let result = await getCommissionRate(apppUserIdF2);
          if (result) {
            let amountF2 = amount * result.F2;
            let resultBonus = await _payCommissionForUser(apppUserIdF2, amountF2);
            if (!resultBonus) {
              reject('Bonus FAC F2 failed');
            }
          } else {
            reject('Can not get commission rate');
          }
        }
        if (resultUser.memberReferIdF3 !== null) {
          let apppUserIdF3 = resultUser.memberReferIdF3;
          let result = await getCommissionRate(apppUserIdF3);
          if (result) {
            let amountF3 = amount * result.F3;
            let resultBonus = await _payCommissionForUser(apppUserIdF3, amountF3);
            if (!resultBonus) {
              reject('Bonus FAC F2 failed');
            }
          } else {
            reject('Can not get commission rate');
          }
        }
        resolve('DONE');
      } else {
        reject('User not found');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

function _getGameRecordTypeFromName(gameType) {
  let gameRecordType;
  switch (gameType) {
    case BET_TYPE.XSST1P_LOXIEN_XIEN2:
    case BET_TYPE.XSST1P_LOXIEN_XIEN3:
    case BET_TYPE.XSST1P_LOXIEN_XIEN4:
    case BET_TYPE.XSST1P_DE_DEDAUGIAINHAT:
    case BET_TYPE.XSST1P_DE_DEDAUDACBIET:
    case BET_TYPE.XSST1P_DE_DEDACBIET:
    case BET_TYPE.XSST1P_DE_DAU:
    case BET_TYPE.XSST1P_DE_ĐAUDUOI:
    case BET_TYPE.XSST1P_DAUDUOI_DAU:
    case BET_TYPE.XSST1P_DAUDUOI_DUOI:
    case BET_TYPE.XSST1P_3CANG_DAU:
    case BET_TYPE.XSST1P_3CANG_DACBIET:
    case BET_TYPE.XSST1P_3CANG_DAUDUOI:
    case BET_TYPE.XSST1P_4CANG_DACBIET:
    case BET_TYPE.XSST1P_LOTRUOT_XIEN4:
    case BET_TYPE.XSST1P_LOTRUOT_XIEN8:
    case BET_TYPE.XSST1P_LOTRUOT_XIEN10:
    case BET_TYPE.XSST1P_BAOLO_LO2:
    case BET_TYPE.XSST1P_BAOLO_LO3:
    case BET_TYPE.XSST1P_BAOLO_LO4: {
      gameRecordType = BET_TYPE.XSST1P_DEFAULT;
      break;
    }
    case BET_TYPE.XSTT_LOXIEN_XIEN2:
    case BET_TYPE.XSTT_LOXIEN_XIEN3:
    case BET_TYPE.XSTT_LOXIEN_XIEN4:
    case BET_TYPE.XSTT_DE_DEDAUGIAINHAT:
    case BET_TYPE.XSTT_DE_DEDAUDACBIET:
    case BET_TYPE.XSTT_DE_DEDACBIET:
    case BET_TYPE.XSTT_DE_DAU:
    case BET_TYPE.XSTT_DE_ĐAUDUOI:
    case BET_TYPE.XSTT_DAUDUOI_DAU:
    case BET_TYPE.XSTT_DAUDUOI_DUOI:
    case BET_TYPE.XSTT_3CANG_DAU:
    case BET_TYPE.XSTT_3CANG_DACBIET:
    case BET_TYPE.XSTT_3CANG_DAUDUOI:
    case BET_TYPE.XSTT_4CANG_DACBIET:
    case BET_TYPE.XSTT_LOTRUOT_XIEN4:
    case BET_TYPE.XSTT_LOTRUOT_XIEN8:
    case BET_TYPE.XSTT_LOTRUOT_XIEN10:
    case BET_TYPE.XSTT_BAOLO_LO2:
    case BET_TYPE.XSTT_BAOLO_LO3:
    case BET_TYPE.XSTT_BAOLO_LO4: {
      gameRecordType = BET_TYPE.XSTT_DEFAULT;
      break;
    }
  }
  return gameRecordType;
}

function checkIfNowisPlayGameRecord(gameRecordType) {
  let _sectionDiff = moment().unix() - moment(GAME_SECTION_START_TIME, 'YYYYMMDD').startOf('day').unix();
  let _timeDiffPerSection = getTimeDiffPerSectionByGame(gameRecordType);

  let _sectionIndex = parseInt(_sectionDiff / _timeDiffPerSection);
  let _isPlayGameRecord = false;

  if (_sectionIndex % 2 === 0) {
    _isPlayGameRecord = true;
  }

  return _isPlayGameRecord;
}
module.exports = {
  botPlaceNewBet,
  checkIfNowisPlayGameRecord,
  addBonusPaymentForReferUser,
  addBetRecordListToCacheByUser,
  cacheTotalBetAmountInByUser,
  cacheTotalBetMissionAmountInByUser,
  clearTotalAmountInMissionRecordListByUser,
  clearTotalAmountInRecordListByUser,
  cleanAllLiveRecordByBetType,
  placeUserBet,
  placeUserBetTemp,
  placeUserMissionTemp,
  placeUserMissionBet,
  refreshCacheTotalBetAmountInByBetType,
  refreshCachedTotalBetAmountInByUser,
  refreshCachedTotalBetMissionAmountInByUser,
  getAllCachedTotalBetAmountInByType,
  getAllCachedTotalMissionBetAmountInByType,
  getAllBetRecordListByUser,
  getAllBetMissionRecordByUser,
  getCachedTotalBetAmountInByUser,
  getCachedTotalBetMissionAmountInByUser,
  cacheWinLoseAmountByUser,
  updateWinLoseForBetGame,
  updateWinLoseForMission,
  pushNotificationBetGameResult,
  pushNotificationMissionBetGameResult,
  getCurrentBetSection,
  removeBetRecordListToCacheByUser,
  removeAllBetMissionRecordListByUser,
  removeAllBetRecordListByUser,
  sumBetRecordBonusForUser,
  updateAllBonusPaymentStatusByUser,
  payCommissionForReferalByUserId,
  getCommissionRate,
  getCachedTotalBetAmountInByGameId,
  getCachedTotalBetAmountInByBetType,
  getCachedTotalAmountInByRoom,
  getCachedTotalAmountWinByRoom,
  getTotalPlayOfAllRealUserFromCache,
  getListOfAllRealUserPlayingFromCache,
};
