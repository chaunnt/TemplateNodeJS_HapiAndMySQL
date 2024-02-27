/* Copyright (c) 2022-2024 Reminano */

const moment = require('moment');

const { CronInstance } = require('../../../../ThirdParty/Cronjob/CronInstance');
const Logger = require('../../../../utils/logging');

const {
  updateLatestGameResult,
  updateWinLoseResultForBetRecord,
  updateAllOldRecordByBetType,
  updateAllOldMissionRecordByBetType,
  addFutureGameRecord,
  updateAllOldMissionHistory,
  checkWinLoseResultForMissionRecord,
} = require('./updateGameResult');
const {
  BET_TYPE,
  GAME_ID,
  GAME_RECORD_UNIT_BO,
  GAME_RECORD_UNIT_CRYPTO_IDX,
  BET_VALUE,
} = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const { refreshPriceData, fetchPriceData } = require('./BOTradingBinance');
const { randomFloatByMinMax, executeBatchPromise, isNotValidValue } = require('../../../ApiUtils/utilFunctions');
const { moveToGameRecordHistory } = require('./moveGameRecord');
const { autoDeleteOldGameRecord } = require('./autoDeleteOldGameRecord');
const {
  pushNotificationBetGameResult,
  pushNotificationMissionBetGameResult,
  getAllCachedTotalBetAmountInByType,
  placeUserBet,
  addBonusPaymentForReferUser,
  getAllCachedTotalMissionBetAmountInByType,
  placeUserMissionBet,
} = require('../../../GamePlayRecords/GamePlayRecordsFunctions');
const {
  getTimeDiffPerSectionByGame,
  getLastGameSection,
  getFutureGameSection,
  completeGameRecordById,
  completeNonPlayGameRecordByType,
  isPlayGameRecord,
  getCurrentGameSection,
  getAssignedGameRecordFromCached,
  clearAssignedGameRecordToCached,
  getLatestGameRecord,
} = require('../../GameRecordFunctions');
const { GAME_SECTION_TIME_DISPLAY_FORMAT, GAME_SECTION_START_TIME } = require('../../GameRecordConstant');
const AppUsersResourceAccess = require('../../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { increaseTotalPlayForUser, increaseTotalPlayForSupervisorByUserId } = require('../../../AppUserMonthlyReport/AppUserMonthlyReportFunctions');
const { GAME_NAME } = require('../../../GameInfo/GameInfoConstant');
const { checkReadyToStartUserMission, updateUserMissionInfo } = require('../../../AppUserMission/AppUserMissionFunction');
const { USER_MISSION_ERROR } = require('../../../AppUserMission/AppUserMissionConstant');
const { updateTotalPlayForUser } = require('../../../LeaderBoard/LeaderFunction');
const { publishJSONToClient } = require('../../../../ThirdParty/SocketIO/SocketIOClient');

async function _handleUserPlaceBetRecord(placeBetRecordData) {
  try {
    if (!placeBetRecordData.appUserId) {
      return;
    }

    let currentUser = await AppUsersResourceAccess.findById(placeBetRecordData.appUserId);
    if (!currentUser) {
      return;
    }

    let placeResult = await placeUserBet(
      currentUser,
      placeBetRecordData.betRecordAmountIn,
      placeBetRecordData.betRecordValue,
      placeBetRecordData.betRecordSection,
      placeBetRecordData.betRecordType,
      placeBetRecordData.betRecordUnit,
      false,
      placeBetRecordData.createdAt,
    );

    if (placeResult) {
      await Promise.all([
        addBonusPaymentForReferUser(currentUser.appUserId, placeBetRecordData.betRecordAmountIn),
        increaseTotalPlayForUser(currentUser.appUserId, placeBetRecordData.betRecordAmountIn),
        increaseTotalPlayForSupervisorByUserId(currentUser.appUserId, placeBetRecordData.betRecordAmountIn),
      ]);
      return placeResult;
    } else {
      Logger.error(`error BetRecord _handleUserPlaceBetRecord with appUserId ${currentUser.appUserId}: `);
      return undefined;
    }
  } catch (error) {
    Logger.error(error);
  }
}

async function _handleUserPlaceMissionBetRecord(placeBetRecordData) {
  try {
    if (!placeBetRecordData.appUserId) {
      return;
    }

    let currentUser = await AppUsersResourceAccess.findById(placeBetRecordData.appUserId);
    if (!currentUser) {
      return;
    }

    let __existingMissionId = await checkReadyToStartUserMission(placeBetRecordData.appUserId);

    if (isNotValidValue(__existingMissionId)) {
      Logger.error(`error BetRecord _handleUserPlaceMissionBetRecord with appUserId ${currentUser.appUserId}: `);
      Logger.info(USER_MISSION_ERROR.MISSION_ALREADY_FINISHED);
      return;
    }

    let placeResult = await placeUserMissionBet(
      currentUser,
      placeBetRecordData.betRecordAmountIn,
      placeBetRecordData.betRecordValue,
      placeBetRecordData.betRecordSection,
      placeBetRecordData.betRecordType,
      placeBetRecordData.betRecordUnit,
      placeBetRecordData.appUserMissionHistoryId,
      placeBetRecordData.createdAt,
    );

    if (placeResult) {
      return placeResult;
    } else {
      Logger.error(`error BetRecord _handleUserPlaceMissionBetRecord with appUserId ${currentUser.appUserId}: `);
      return undefined;
    }
  } catch (error) {
    Logger.error(error);
  }
}

async function _handleAllUserPlaceBetRecord(gameRecordType, currentGameSection) {
  let _allPlayRecord = getAllCachedTotalBetAmountInByType(gameRecordType);
  console.log('_allPlayRecord: ', _allPlayRecord);

  if (!_allPlayRecord) {
    return;
  }

  for (let i = 0; i < Object.keys(_allPlayRecord).length; i++) {
    const _betRecordName = Object.keys(_allPlayRecord)[i];
    if (_allPlayRecord[_betRecordName].recordAmountIn === 0) {
      continue;
    }
    let __betRecordData = _betRecordName.split('_');
    let _cachePlaceBetRecordData = _allPlayRecord[_betRecordName];
    let _appUserId = __betRecordData[0];

    let placeBetRecordData = {
      betRecordAmountIn: _cachePlaceBetRecordData.betAmountIn,
      betRecordValue: _cachePlaceBetRecordData.betValue,
      betRecordType: gameRecordType,
      betRecordUnit: GAME_RECORD_UNIT_BO.BTC,
      betRecordSection: _cachePlaceBetRecordData.gameRecordSection,
      appUserId: _appUserId,
      createdAt: _cachePlaceBetRecordData.createdAt,
    };

    if (!isPlayGameRecord(_cachePlaceBetRecordData.gameRecordSection)) {
      let previousGameSection = getCurrentGameSection(GAME_ID.BINARYOPTION, gameRecordType, GAME_RECORD_UNIT_BO.BTC);
      placeBetRecordData.betRecordSection = previousGameSection;
    }
    if (currentGameSection == _cachePlaceBetRecordData.gameRecordSection) {
      await _handleUserPlaceBetRecord(placeBetRecordData);
      await updateTotalPlayForUser(_appUserId);
    }
    _allPlayRecord[_betRecordName].recordAmountIn = 0;
  }
}

async function _handleAllUserPlaceBetMissionRecord(gameRecordType, currentGameSection) {
  let _allPlayRecord = getAllCachedTotalMissionBetAmountInByType(gameRecordType);

  if (!_allPlayRecord) {
    return;
  }

  let _needToUpdateUserMissionList = [];
  for (let i = 0; i < Object.keys(_allPlayRecord).length; i++) {
    const _betRecordName = Object.keys(_allPlayRecord)[i];
    if (_allPlayRecord[_betRecordName].recordAmountIn === 0) {
      continue;
    }
    let __betRecordData = _betRecordName.split('_');
    let _cachePlaceBetRecordData = _allPlayRecord[_betRecordName];
    let _appUserId = __betRecordData[0];

    let placeBetRecordData = {
      betRecordAmountIn: _cachePlaceBetRecordData.betAmountIn,
      betRecordValue: _cachePlaceBetRecordData.betValue,
      betRecordType: gameRecordType,
      betRecordUnit: GAME_RECORD_UNIT_BO.BTC,
      betRecordSection: _cachePlaceBetRecordData.gameRecordSection,
      appUserId: _appUserId,
      createdAt: _cachePlaceBetRecordData.createdAt,
      appUserMissionHistoryId: _cachePlaceBetRecordData.appUserMissionHistoryId,
    };
    if (!isPlayGameRecord(_cachePlaceBetRecordData.gameRecordSection)) {
      let previousGameSection = getCurrentGameSection(GAME_ID.BINARYOPTION, gameRecordType, GAME_RECORD_UNIT_BO.BTC);
      placeBetRecordData.betRecordSection = previousGameSection;
    }
    if (currentGameSection == _cachePlaceBetRecordData.gameRecordSection) {
      await _handleUserPlaceMissionBetRecord(placeBetRecordData);
      await updateUserMissionInfo(_appUserId);
    }
    _allPlayRecord[_betRecordName].recordAmountIn = 0;
  }
}
function publishLiveData(liveData) {
  publishJSONToClient(`LIVE_DATA`, liveData);
}

async function _publishDataByGameRecordType(gameRecordType, cryptoName) {
  // Difference in minutes
  var diffSecond = moment(GAME_SECTION_START_TIME, 'YYYYMMDD').startOf('year').diff(moment(), 'seconds') * -1;
  let diffSecondPerSection = getTimeDiffPerSectionByGame(gameRecordType);

  let passoverSecond = Math.floor(diffSecond % diffSecondPerSection);

  const cachedPriceKey = `${gameRecordType}_${GAME_RECORD_UNIT_BO[cryptoName]}`;
  let _timePassover = passoverSecond > 0 ? passoverSecond : 0;

  if (passoverSecond === 0) {
    _timePassover = diffSecondPerSection;
  }

  let _marketData = fetchPriceData(cachedPriceKey, _timePassover, moment().format(GAME_SECTION_TIME_DISPLAY_FORMAT));
  let _newMarketData = _marketData;

  if (!_newMarketData.high || !_newMarketData.low || !_newMarketData.close || !_newMarketData.open) {
    return;
  }

  let _liveData = {
    ..._newMarketData,
    section: moment().format(GAME_SECTION_TIME_DISPLAY_FORMAT),
    unit: GAME_RECORD_UNIT_BO[cryptoName],
    gameRecordType: gameRecordType,
  };

  publishLiveData(_liveData);
  return _marketData;
}

async function _createNewSection(gameRecordType, cryptoName) {
  let _gameRecordUnit = GAME_RECORD_UNIT_BO[cryptoName];

  // Your moment
  var mmt = moment();

  // Your moment at midnight
  var mmtMidnight = mmt.clone().startOf('day');

  // Difference in minutes
  var diffSecond = mmt.diff(mmtMidnight, 'seconds');

  let diffSecondPerSection = getTimeDiffPerSectionByGame(gameRecordType);

  if (diffSecond % diffSecondPerSection === 0) {
    let previousGameSection = getLastGameSection(GAME_ID.BINARYOPTION, gameRecordType, _gameRecordUnit);
    let currentGameSection = getCurrentGameSection(GAME_ID.BINARYOPTION, gameRecordType, _gameRecordUnit);

    let _isPlayGameRecord = isPlayGameRecord(previousGameSection);

    if (!_isPlayGameRecord) {
      setTimeout(() => {
        Promise.all([
          _handleAllUserPlaceBetRecord(gameRecordType, currentGameSection, previousGameSection),
          _handleAllUserPlaceBetMissionRecord(gameRecordType, currentGameSection),
        ]).then(result => {
          Logger.info('OKKKKKKKKKKKKKKKKKKKKK');
        });
      }, 2000);
    }

    let gameRecordValue = await _publishDataByGameRecordType(gameRecordType, cryptoName);
    if (!gameRecordValue) {
      Logger.error(`ERROR _publishDataByGameRecordType IS INVALID`);
      //find lastest game record
      let _latestGameRecord = await getLatestGameRecord(gameRecordType);
      if (_latestGameRecord) {
        const latestClosePrice = parseFloat(_latestGameRecord.gameRecordValue.split(';')[4]);
        gameRecordValue = {
          low: latestClosePrice,
          high: latestClosePrice,
          open: latestClosePrice,
          close: latestClosePrice,
          volume: 0,
        };
      } else {
        Logger.error(`ERROR11 _publishDataByGameRecordType IS INVALID`);
        return;
      }
    }

    let gameValue = 0;
    if (gameRecordValue.open > gameRecordValue.close) {
      gameValue = randomFloatByMinMax(gameRecordValue.close, gameRecordValue.open);
    } else if (gameRecordValue.open < gameRecordValue.close) {
      gameValue = randomFloatByMinMax(gameRecordValue.open, gameRecordValue.close);
    } else {
      gameValue = gameRecordValue.close;
    }
    gameRecordValue = `${gameValue};0;0;${gameRecordValue.open};${gameRecordValue.close};${gameRecordValue.high};${gameRecordValue.low};${gameRecordValue.volume}`;

    //tạo kết quả kỳ
    let marketData = gameRecordValue;
    const open = parseFloat(marketData.split(';')[3]);
    const close = parseFloat(marketData.split(';')[4]);
    function _checkUpdown(gameValue, gameValuePrevious) {
      let isUp = null;
      if (gameValue > gameValuePrevious) {
        isUp = BET_VALUE.BINARYOPTION.TANG;
      } else if (gameValue < gameValuePrevious) {
        isUp = BET_VALUE.BINARYOPTION.GIAM;
      } else {
        isUp = BET_VALUE.BINARYOPTION.HOA;
      }
      return isUp;
    }
    const isUp = _checkUpdown(close, open);

    let _resultGameRecord = {
      gameRecordSection: previousGameSection,
      gameRecordType: gameRecordType,
      gameRecordUnit: _gameRecordUnit,
      gameRecordValue: gameRecordValue,
      gameRecordResult: isUp,
      isPlayGameRecord: _isPlayGameRecord,
    };
    clearAssignedGameRecordToCached(previousGameSection);

    // push ket qua ky
    publishJSONToClient(GAME_NAME.BINARYOPTION, _resultGameRecord);

    let _finishGameId = await updateLatestGameResult(previousGameSection, gameRecordType, gameRecordValue, _gameRecordUnit);

    Promise.all([
      updateWinLoseResultForBetRecord(previousGameSection),
      checkWinLoseResultForMissionRecord(previousGameSection, gameRecordType, _gameRecordUnit),
      completeGameRecordById(_finishGameId),
    ]).then(() => {
      Logger.info(`FINISH updateWinLoseResultForBetRecord ${previousGameSection}`);
      Logger.info(`FINISH checkWinLoseResultForMissionRecord ${previousGameSection}`);
      Logger.info(`FINISH completeGameRecordById ${_finishGameId}`);
      Promise.all([pushNotificationBetGameResult(gameRecordType), pushNotificationMissionBetGameResult(gameRecordType)]).then(notificationResult => {
        Logger.info(`FINISH pushNotificationBetGameResult ${gameRecordType}`);
        Logger.info(`FINISH pushNotificationMissionBetGameResult ${gameRecordType}`);
      });
    });
    //TODO
    // completeNonPlayGameRecordByType(gameRecordType),
    // refreshPriceDataByUnit(gameRecordType, gameUnit),
    // ]);
    // setTimeout(() => {

    // }, 1000);
    // setTimeout(() => {
    //   // updateAllOldRecordByBetType(gameRecordType).then(() => {
    //   Logger.info(`updateAllOldRecordByBetTypeupdateAllOldRecordByBetType ${gameRecordType}`);
    //   // });
    //   // updateAllOldMissionRecordByBetType(gameRecordType).then(() => {
    //   Logger.info(`updateAllOldMissionRecordByBetTypeupdateAllOldMissionRecordByBetType ${gameRecordType}`);
    //   // });
    //   // updateAllOldMissionHistory().then(() => {
    //   Logger.info(`updateAllOldMissionHistoryupdateAllOldMissionHistory ${gameRecordType}`);
    //   // });
    // }, 5000);
  } else {
    await _publishDataByGameRecordType(gameRecordType, cryptoName);
  }
}

async function startSchedule() {
  Logger.info(`Start Binary option Jobs: ${new Date()}`);

  // //do not run schedule on DEV environments
  // if (process.env.NODE_ENV === 'dev') {
  //   return;
  // }

  // everyday 4h AM
  // CronInstance.schedule('0 4 * * *', function () {
  //move GameRecords to GameRecordHistory
  // Promise.all([
  // moveToGameRecordHistory();
  //WARNING !!
  // autoDeleteOldGameRecord()
  // ]);
  // });
  // everyday 1 minute
  CronInstance.schedule('10 * * * * *', function () {
    let _gameRecordType = BET_TYPE.BINARYOPTION_UPDOWN_15S;
    updateAllOldRecordByBetType(_gameRecordType).then(() => {
      Logger.info(`updateAllOldRecordByBetTypeupdateAllOldRecordByBetType ${_gameRecordType}`);
    });
    updateAllOldMissionRecordByBetType(_gameRecordType).then(() => {
      Logger.info(`updateAllOldMissionRecordByBetTypeupdateAllOldMissionRecordByBetType ${_gameRecordType}`);
    });
  });
  // everyday 3 minute
  CronInstance.schedule('20 */3 * * * *', function () {
    let _gameRecordType = BET_TYPE.BINARYOPTION_UPDOWN_45S;
    updateAllOldRecordByBetType(_gameRecordType).then(() => {
      Logger.info(`updateAllOldRecordByBetTypeupdateAllOldRecordByBetType ${_gameRecordType}`);
    });
    updateAllOldMissionRecordByBetType(_gameRecordType).then(() => {
      Logger.info(`updateAllOldMissionRecordByBetTypeupdateAllOldMissionRecordByBetType ${_gameRecordType}`);
    });
  });
  // everyday 10 minute
  CronInstance.schedule('30 */10 * * * *', function () {
    let _gameRecordType = BET_TYPE.BINARYOPTION_UPDOWN_180S;
    updateAllOldRecordByBetType(_gameRecordType).then(() => {
      Logger.info(`updateAllOldRecordByBetTypeupdateAllOldRecordByBetType ${_gameRecordType}`);
    });
    updateAllOldMissionRecordByBetType(_gameRecordType).then(() => {
      Logger.info(`updateAllOldMissionRecordByBetTypeupdateAllOldMissionRecordByBetType ${_gameRecordType}`);
    });
  });

  // everyday second
  CronInstance.schedule('* * * * * *', function () {
    let _promiseList = [];
    for (let i = 0; i < Object.keys(BET_TYPE).length; i++) {
      const _betType = Object.keys(BET_TYPE)[i];
      for (let j = 0; j < Object.keys(GAME_RECORD_UNIT_BO).length; j++) {
        const cryptoName = Object.keys(GAME_RECORD_UNIT_BO)[j];
        _promiseList.push(_createNewSection(_betType, cryptoName));
      }
    }
    Promise.all(_promiseList).finally(() => {
      Logger.info(`_createNewSection ${new Date()}`);
    });
  });
}

module.exports = {
  startSchedule,
};
