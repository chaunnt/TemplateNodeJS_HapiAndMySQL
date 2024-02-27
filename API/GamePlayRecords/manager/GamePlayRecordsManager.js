/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GamePlayRecordsResourceAccess = require('../resourceAccess/GamePlayRecordsResourceAccess');
const GamePlayRecordsFunction = require('../GamePlayRecordsFunctions');
const GamePlayRecordsStatisticFunctions = require('../GamePlayRecordsStatisticFunctions');
const GamePlayRecordsView = require('../resourceAccess/GamePlayRecordsView');
const AppUserMissionPlayView = require('../resourceAccess/AppUserMissionPlayView');
const AppUserMissionPlayResourceAccess = require('../resourceAccess/AppUserMissionPlayResourceAccess');
const GameRecordsResourceAccess = require('../../GameRecord/resourceAccess/GameRecordsResourceAccess');
const {
  BET_STATUS,
  BET_TYPE,
  GAME_ID,
  PLACE_RECORD_ERROR,
  BET_RESULT,
  BET_VALUE,
  GAME_RECORD_UNIT_BO,
  BET_AMOUNT_MIN,
  BET_AMOUNT_MAX,
} = require('../GamePlayRecordsConstant');
const { ERROR, UNKNOWN_ERROR, NOT_ENOUGH_AUTHORITY, POPULAR_ERROR } = require('../../Common/CommonConstant');
const moment = require('moment');
const {
  increaseTotalPlayForUser,
  increaseTotalPlayForSupervisorUser,
  increaseTotalPlayForSupervisorByUserId,
} = require('../../AppUserMonthlyReport/AppUserMonthlyReportFunctions');
const { getCurrentGameSection, getFutureGameSection, isPlayGameRecordByType, isPlayGameRecord } = require('../../GameRecord/GameRecordFunctions');
const {
  checkReadyToStartUserMission,
  getUserMissionInfo,
  reloadDailyMission,
  updateUserMissionInfo,
} = require('../../AppUserMission/AppUserMissionFunction');
const { USER_MISSION_ERROR, MISSION_DAY_DATA_FORMAT, MISSION_STATUS } = require('../../AppUserMission/AppUserMissionConstant');
const { isNotValidValue } = require('../../ApiUtils/utilFunctions');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const { retrieveUserDetail } = require('../../AppUsers/AppUsersFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserMissionInfoResourceAccess = require('../../AppUserMission/resourceAccess/AppUserMissionInfoResourceAccess');
const AppUserMissionHistoryResourceAccess = require('../../AppUserMission/resourceAccess/AppUserMissionHistoryResourceAccess');
const Logger = require('../../../utils/logging');
const { getSystemConfig } = require('../../SystemConfigurations/SystemConfigurationsFunction');
async function insert(req) {
  return new Promise(async (resolve, reject) => {
    resolve('success');
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let betRecordList = await GamePlayRecordsView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (betRecordList && betRecordList.length > 0) {
        let betRecordCount = await GamePlayRecordsView.customCount(filter, startDate, endDate, searchText);
        let betRecordSum = await GamePlayRecordsView.customSum('betRecordAmountIn', filter, searchText, startDate, endDate, order);

        resolve({ data: betRecordList, total: betRecordCount[0].count, totalSum: betRecordSum[0].sumResult });
      } else {
        resolve({ data: [], total: 0, totalSum: 0 });
      }
    } catch (e) {
      Logger.error(`error find bet record: `, e);
      reject('failed');
    }
  });
}

async function getMissionPlayHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let betRecordList = await AppUserMissionPlayView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (betRecordList && betRecordList.length > 0) {
        let betRecordCount = await AppUserMissionPlayView.customCount(filter, startDate, endDate, searchText);
        let betRecordSum = await AppUserMissionPlayView.customSum('betRecordAmountIn', filter, searchText, startDate, endDate, order);
        resolve({ data: betRecordList, total: betRecordCount[0].count, totalSum: betRecordSum[0].sumResult });
      } else {
        resolve({ data: [], total: 0, totalSum: 0 });
      }
    } catch (e) {
      Logger.error(`error find bet record: `, e);
      reject('failed');
    }
  });
}
async function getTotalPlayOfAllRealUserByBetType(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _betRecordType = req.payload.betRecordType;
      let _realPlayData = {
        totalPlay: GamePlayRecordsFunction.getTotalPlayOfAllRealUserFromCache(_betRecordType),
        realPlayDataList: GamePlayRecordsFunction.getListOfAllRealUserPlayingFromCache(_betRecordType),
      };
      return resolve(_realPlayData);
    } catch (e) {
      Logger.error(`error find bet record: `, e);
      reject('failed');
    }
  });
}
async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let updateResult = await GamePlayRecordsResourceAccess.updateById(req.payload.id, req.payload.data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(`error update by id bet record ${req.payload.id}: `, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let betRecordList = await GamePlayRecordsView.find({ betRecordId: req.payload.id });
      if (betRecordList && betRecordList.length > 0) {
        resolve(betRecordList[0]);
      } else {
        Logger.error(`error BetRecord findById with betRecordId ${req.payload.id}: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error bet record findById:${req.payload.id}`, e);
      reject('failed');
    }
  });
}

async function userGetListPlayRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      //only get record of current user
      filter.appUserId = req.currentUser.appUserId;

      let betRecordList = await GamePlayRecordsResourceAccess.customSearch(filter, skip, limit, startDate, endDate, undefined, order);
      if (betRecordList && betRecordList.length > 0) {
        let betRecordCount = await GamePlayRecordsResourceAccess.customCount(filter, startDate, endDate);
        let betRecordSum = await GamePlayRecordsResourceAccess.customSum('betRecordWin', filter, startDate, endDate);
        let betPlaySum = await GamePlayRecordsResourceAccess.customSum('betRecordAmountIn', filter, startDate, endDate);
        resolve({
          data: betRecordList,
          total: betRecordCount[0].count,
          totalSumBetRecordWin: betRecordSum[0].sumResult,
          totalSumBetRecordPlay: betPlaySum[0].sumResult,
        });
      } else {
        resolve({ data: [], total: 0, totalSumBetRecordWin: 0, totalSumBetRecordPlay: 0 });
      }
    } catch (e) {
      Logger.error(`error get list:`, e);
      reject('failed');
    }
  });
}

function _getAllCachedTotalBetAmountInByUser(appUserId) {
  let _totalPlay = 0;
  for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    const _betType = Object.values(BET_TYPE)[i];

    // if (!isPlayGameRecordByType(_betType)) {
    let _playDataArray = GamePlayRecordsFunction.getCachedTotalBetAmountInByUser({ appUserId: appUserId, username: '' }, _betType);
    for (let counter = 0; counter < _playDataArray.length; counter++) {
      const _playData = _playDataArray[counter];
      if (_playData.recordAmountIn) {
        _totalPlay += _playData.recordAmountIn * 1;
      }
    }
    // }
  }
  return _totalPlay;
}

function _getAllCachedTotalMissionBetAmountInByUser(appUserId) {
  let _totalPlay = 0;
  for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    const _betType = Object.values(BET_TYPE)[i];
    // if (!isPlayGameRecordByType(_betType)) {
    let _playDataArray = GamePlayRecordsFunction.getCachedTotalBetMissionAmountInByUser({ appUserId: appUserId, username: '' }, _betType);
    for (let counter = 0; counter < _playDataArray.length; counter++) {
      const _playData = _playDataArray[counter];
      if (_playData.recordAmountIn) {
        _totalPlay += _playData.recordAmountIn * 1;
      }
    }
    // }
  }
  return _totalPlay;
}

async function _fetchLatestPlayInfoFromUser(appUserId) {
  let foundUser = await retrieveUserDetail(appUserId);
  if (foundUser) {
    if (foundUser.wallets && foundUser.wallets.length > 0) {
      for (let i = 0; i < foundUser.wallets.length; i++) {
        const _wallet = foundUser.wallets[i];
        if (_wallet.walletType === WALLET_TYPE.POINT) {
          foundUser.wallets[i].balance = foundUser.wallets[i].balance - _getAllCachedTotalBetAmountInByUser(foundUser.appUserId);
        } else if (_wallet.walletType === WALLET_TYPE.MISSION) {
          foundUser.wallets[i].balance = foundUser.wallets[i].balance - _getAllCachedTotalMissionBetAmountInByUser(foundUser.appUserId);
        }
      }
    }
    let _betRecordList = GamePlayRecordsFunction.getAllBetRecordListByUser(foundUser);
    if (_betRecordList) {
      foundUser.betRecordList = _betRecordList;
    }

    let _betMissionRecordList = GamePlayRecordsFunction.getAllBetMissionRecordByUser(foundUser);
    if (_betMissionRecordList) {
      foundUser.betMissionRecordList = _betMissionRecordList;
    }
  }
  return foundUser;
}
async function userPlaceBetRecordTemp(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      if (!_currentUser) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }
      if (req.payload.betRecordAmountIn > 0) {
        if (req.payload.betRecordAmountIn < BET_AMOUNT_MIN) {
          return reject(PLACE_RECORD_ERROR.ERR_BET_AMOUNT_MIN);
        }
      }
      if (req.payload.betRecordAmountIn > BET_AMOUNT_MAX) {
        return reject(PLACE_RECORD_ERROR.ERR_BET_AMOUNT_MAX);
      }
      let placeData = req.payload;

      let gameSections = getFutureGameSection(GAME_ID.BINARYOPTION, placeData.betRecordType, placeData.betRecordUnit);
      if (isPlayGameRecord(gameSections) === 0) {
        let currentGameSection = getCurrentGameSection(GAME_ID.BINARYOPTION, placeData.betRecordType, placeData.betRecordUnit);
        let checkGameSection = gameSections.split('-')[0];
        if (placeData.betRecordType == BET_TYPE.BINARYOPTION_UPDOWN_15S) {
          checkGameSection = checkGameSection * 1 - 15;
        } else if (placeData.betRecordType == BET_TYPE.BINARYOPTION_UPDOWN_45S) {
          checkGameSection = checkGameSection * 1 - 45;
        } else if (placeData.betRecordType == BET_TYPE.BINARYOPTION_UPDOWN_180S) {
          checkGameSection = checkGameSection * 1 - 180;
        }
        let numCurrentGameSection = currentGameSection.split('-')[0];
        if (checkGameSection * 1 === numCurrentGameSection * 1) {
          gameSections = currentGameSection;
        } else {
          return reject(PLACE_RECORD_ERROR.PLACEBET_FAIL);
        }
      }
      const result = await GamePlayRecordsFunction.placeUserBetTemp(
        req.currentUser,
        placeData.betRecordAmountIn,
        placeData.betRecordValue,
        placeData.betRecordType,
        placeData.betRecordUnit,
        gameSections,
      );

      if (result) {
        if (result == PLACE_RECORD_ERROR.ERR_BET_AMOUNT_MAX) {
          return reject(result);
        }
        let _foundUser = await _fetchLatestPlayInfoFromUser(req.currentUser.appUserId);
        return resolve(_foundUser);
      }
      return reject(result);
    } catch (e) {
      Logger.error(`error BetRecord userPlaceBetRecordTemp: ${e}`);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_MISSION_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(PLACE_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function _getPlayRecordOfUserFromAllOtherBetType(appUserId, excludeBetType) {
  let _totalBetTypePlay = 0;
  for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    const _betType = Object.values(BET_TYPE)[i];
    if (_betType === excludeBetType) {
      continue;
    }
    let _totalPlay = 0;
    if (!isPlayGameRecordByType(_betType)) {
      let _playDataArray = GamePlayRecordsFunction.getCachedTotalBetMissionAmountInByUser({ appUserId: appUserId, username: '' }, _betType);
      for (let counter = 0; counter < _playDataArray.length; counter++) {
        const _playData = _playDataArray[counter];
        _totalPlay += _playData.betAmountIn * 1;
      }
    }
    if (_totalPlay > 0) {
      _totalBetTypePlay++;
    }
  }
  return _totalBetTypePlay;
}

async function userPlaceMissionRecordTemp(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      if (!_currentUser) {
        return reject(NOT_ENOUGH_AUTHORITY);
      }
      if (req.payload.betRecordAmountIn > 0) {
        if (req.payload.betRecordAmountIn < BET_AMOUNT_MIN) {
          return reject(PLACE_RECORD_ERROR.ERR_BET_AMOUNT_MIN);
        }
      }
      if (req.payload.betRecordAmountIn > BET_AMOUNT_MAX) {
        return reject(PLACE_RECORD_ERROR.ERR_BET_AMOUNT_MAX);
      }

      let systemConfig = await getSystemConfig();
      if (systemConfig.lockMissionAllUser !== 1) {
        return reject(USER_MISSION_ERROR.MISSION_LOCKED);
      }
      let placeData = req.payload;
      let user = await AppUserMissionInfoResourceAccess.findById(_currentUser.appUserId);
      if (user.enableMissionPlay !== 1) {
        return reject(USER_MISSION_ERROR.MISSION_LOCKED);
      }
      let gameSections = getFutureGameSection(GAME_ID.BINARYOPTION, placeData.betRecordType, placeData.betRecordUnit);
      if (isPlayGameRecord(gameSections) === 0) {
        let currentGameSection = getCurrentGameSection(GAME_ID.BINARYOPTION, placeData.betRecordType, placeData.betRecordUnit);
        let checkGameSection = gameSections.split('-')[0];
        if (placeData.betRecordType == BET_TYPE.BINARYOPTION_UPDOWN_15S) {
          checkGameSection = checkGameSection * 1 - 15;
        } else if (placeData.betRecordType == BET_TYPE.BINARYOPTION_UPDOWN_45S) {
          checkGameSection = checkGameSection * 1 - 45;
        } else if (placeData.betRecordType == BET_TYPE.BINARYOPTION_UPDOWN_180S) {
          checkGameSection = checkGameSection * 1 - 180;
        }
        let numCurrentGameSection = currentGameSection.split('-')[0];
        if (checkGameSection * 1 === numCurrentGameSection * 1) {
          gameSections = currentGameSection;
        } else {
          return reject(PLACE_RECORD_ERROR.PLACEBET_FAIL);
        }
      }
      if (systemConfig.maxLimitedMissionPerDay > 5) {
        let _userMissionToday = await AppUserMissionHistoryResourceAccess.customSearch({
          appUserId: _currentUser.appUserId,
          missionStartDay: moment().format(MISSION_DAY_DATA_FORMAT),
          missionStatus: MISSION_STATUS.NEW,
        });
        if (_userMissionToday || _userMissionToday.length == 1) {
          await reloadDailyMission(_currentUser.appUserId);
          await updateUserMissionInfo(_currentUser.appUserId);
        }
      }
      let appUserMissionHistoryId = await checkReadyToStartUserMission(_currentUser.appUserId);
      if (isNotValidValue(appUserMissionHistoryId)) {
        Logger.error(`error BetRecord userPlayMission with appUserId ${_currentUser.appUserId}: `);
        return reject(USER_MISSION_ERROR.MISSION_ALREADY_FINISHED);
      }

      let _userMissionInfo = await getUserMissionInfo(_currentUser.appUserId);
      if (_userMissionInfo && _userMissionInfo.mission && _userMissionInfo.mission.playRecord) {
        let _existingPlayTypeCount = await _getPlayRecordOfUserFromAllOtherBetType(_currentUser.appUserId, placeData.betRecordType);
        let _alreadyPlayRecord = await AppUserMissionPlayResourceAccess.customSearch({ appUserMissionHistoryId: appUserMissionHistoryId }, 0, 2);
        if (_alreadyPlayRecord && _alreadyPlayRecord.length > 0) {
          _existingPlayTypeCount = _existingPlayTypeCount + _alreadyPlayRecord;
        }
        if (_userMissionInfo.mission.playRecord.length === 1) {
          if (_existingPlayTypeCount >= 1) {
            return reject(USER_MISSION_ERROR.MISSION_ALREADY_FINISHED);
          }
        } else if (_userMissionInfo.mission.playRecord === 2) {
          if (_existingPlayTypeCount >= 2) {
            return reject(USER_MISSION_ERROR.MISSION_ALREADY_FINISHED);
          }
        } else {
          if (_existingPlayTypeCount >= 2) {
            return reject(USER_MISSION_ERROR.MISSION_ALREADY_FINISHED);
          }
        }
      }

      const result = await GamePlayRecordsFunction.placeUserMissionTemp(
        req.currentUser,
        placeData.betRecordAmountIn,
        placeData.betRecordValue,
        placeData.betRecordType,
        placeData.betRecordUnit,
        gameSections,
        appUserMissionHistoryId,
      );
      if (result) {
        let _foundUser = await _fetchLatestPlayInfoFromUser(_currentUser.appUserId);
        return resolve(_foundUser);
      }
      return resolve(result);
    } catch (e) {
      Logger.error(`error BetRecord userPlaceMissionRecordTemp: ${e}`);
      if (Object.keys(POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_MISSION_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(PLACE_RECORD_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function _handleUserPlaceBetRecord(currentUser, placeBetRecordData) {
  const gameRecordSection = '';
  let placeResult = await GamePlayRecordsFunction.placeUserBet(
    currentUser,
    placeBetRecordData.betRecordAmountIn,
    placeBetRecordData.betRecordValue,
    gameRecordSection,
    placeBetRecordData.betRecordType,
    placeBetRecordData.betRecordUnit,
    currentUser.isVirtualUser,
  );
  if (placeResult) {
    await Promise.all([
      GamePlayRecordsFunction.addBonusPaymentForReferUser(currentUser.appUserId, placeBetRecordData.betRecordAmountIn),
      increaseTotalPlayForUser(currentUser.appUserId, placeBetRecordData.betRecordAmountIn),
      increaseTotalPlayForSupervisorByUserId(currentUser.appUserId, placeBetRecordData.betRecordAmountIn),
    ]);
    return placeResult;
  } else {
    Logger.error(`error BetRecord _handleUserPlaceBetRecord with appUserId ${currentUser.appUserId}: `);
    Logger.error(`placeResult`);
    Logger.error(placeResult);
    return undefined;
  }
}

async function userPlaceBetRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _currentUser = req.currentUser;
      let placeData = req.payload;

      let placeResult = await _handleUserPlaceBetRecord(_currentUser, placeData);
      if (placeResult) {
        return resolve(placeResult);
      } else {
        Logger.error(`error BetRecord userPlaceBetRecord with appUserId ${_currentUser.appUserId}: `);
        return reject(PLACE_RECORD_ERROR.PLACEBET_FAIL);
      }
    } catch (e) {
      Logger.error(`error user Place Bet Record`, e);
      if (e === PLACE_RECORD_ERROR.SELECTION_NAME_INVALID) {
        Logger.error(`error  BetRecord userPlaceBetRecord: ${PLACE_RECORD_ERROR.SELECTION_NAME_INVALID}`);
        return reject(PLACE_RECORD_ERROR.SELECTION_NAME_INVALID);
      } else {
        Logger.error(`error BetRecord userPlaceBetRecord: `);
        return reject(PLACE_RECORD_ERROR.PLACEBET_FAIL);
      }
    }
  });
}

async function sumTotalSystemBetByDate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let betRecordType = req.payload.betRecordType;
      const statisticalGameAmount = await GamePlayRecordsStatisticFunctions.sumTotalSystemBetByDate(betRecordType);
      resolve(statisticalGameAmount);
    } catch (e) {
      Logger.error(`error sum total system bet by date`, e);
      reject('failed');
    }
  });
}

async function userGetTotalBetAmountInByGameId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameInfoId = req.payload.gameInfoId;
      const _totalAmount = await GamePlayRecordsFunction.getCachedTotalBetAmountInByGameId(gameInfoId);
      resolve(_totalAmount);
    } catch (e) {
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetUserPlayMissionAmountByBetType(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let betRecordType = req.payload.betRecordType;
      let _betAmountInList = GamePlayRecordsFunction.getCachedTotalBetMissionAmountInByUser(req.currentUser, betRecordType);
      resolve({
        betRecordType: betRecordType,
        betValuesAmountIn: _betAmountInList,
        gameRecordSection: getCurrentGameSection(GAME_ID.BINARYOPTION, betRecordType, GAME_RECORD_UNIT_BO.BTC),
      });
    } catch (e) {
      Logger.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetUserPlayAmountByBetType(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let betRecordType = req.payload.betRecordType;
      let _betAmountInList = GamePlayRecordsFunction.getCachedTotalBetAmountInByUser(req.currentUser, betRecordType);
      resolve({
        betRecordType: betRecordType,
        betValuesAmountIn: _betAmountInList,
        gameRecordSection: getCurrentGameSection(GAME_ID.BINARYOPTION, betRecordType, GAME_RECORD_UNIT_BO.BTC),
      });
    } catch (e) {
      Logger.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetTotalBetAmountInByBetType(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let betRecordType = req.payload.betRecordType;
      let _betAmountInList = await Promise.all([
        GamePlayRecordsFunction.getCachedTotalBetAmountInByBetType(betRecordType, BET_VALUE.BINARYOPTION.TANG),
        GamePlayRecordsFunction.getCachedTotalBetAmountInByBetType(betRecordType, BET_VALUE.BINARYOPTION.GIAM),
      ]);
      resolve({
        betRecordType: betRecordType,
        betValues: [
          {
            betValue: BET_VALUE.BINARYOPTION.TANG,
            betAmountIn: _betAmountInList[0],
          },
          {
            betValue: BET_VALUE.BINARYOPTION.GIAM,
            betAmountIn: _betAmountInList[1],
          },
        ],
      });
    } catch (e) {
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetTotalAmountInByRoom(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gamePlayRoomId = req.payload.gamePlayRoomId;
      let gameRoomType = req.payload.gameRoomType;
      let group = req.payload.group;
      const totalAmountIn = await GamePlayRecordsFunction.getCachedTotalAmountInByRoom(gamePlayRoomId, gameRoomType, group);
      resolve(totalAmountIn);
    } catch (e) {
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetTotalAmountWinByRoom(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let gamePlayRoomId = req.payload.gamePlayRoomId;
      let gameRoomType = req.payload.gameRoomType;
      const totalAmountIn = await GamePlayRecordsFunction.getCachedTotalAmountWinByRoom(gamePlayRoomId, gameRoomType);
      resolve(totalAmountIn);
    } catch (e) {
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userCancelAllRecordTemp(req) {
  return new Promise(async (resolve, reject) => {
    try {
      await GamePlayRecordsFunction.removeAllBetRecordListByUser(req.currentUser, req.payload.betRecordType);
      GamePlayRecordsFunction.clearTotalAmountInRecordListByUser(req.currentUser, req.payload.betRecordType);
      let _foundUser = await _fetchLatestPlayInfoFromUser(req.currentUser.appUserId);
      return resolve(_foundUser);
    } catch (e) {
      Logger.error(e);
      return reject(UNKNOWN_ERROR);
    }
  });
}

async function userCancelAllMissionRecordTemp(req) {
  return new Promise(async (resolve, reject) => {
    try {
      GamePlayRecordsFunction.removeAllBetMissionRecordListByUser(req.currentUser, req.payload.betRecordType);
      GamePlayRecordsFunction.clearTotalAmountInMissionRecordListByUser(req.currentUser, req.payload.betRecordType);
      let _foundUser = await _fetchLatestPlayInfoFromUser(req.currentUser.appUserId);
      return resolve(_foundUser);
    } catch (e) {
      return reject(UNKNOWN_ERROR);
    }
  });
}
module.exports = {
  insert,
  find,
  getMissionPlayHistory,
  updateById,
  findById,
  getTotalPlayOfAllRealUserByBetType,
  userCancelAllMissionRecordTemp,
  userCancelAllRecordTemp,
  userGetTotalBetAmountInByBetType,
  userGetTotalBetAmountInByGameId,
  userGetUserPlayAmountByBetType,
  userGetUserPlayMissionAmountByBetType,
  userGetListPlayRecord,
  userPlaceBetRecord,
  userPlaceBetRecordTemp,
  userPlaceMissionRecordTemp,
  sumTotalSystemBetByDate,
  userGetTotalAmountInByRoom,
  userGetTotalAmountWinByRoom,
};
