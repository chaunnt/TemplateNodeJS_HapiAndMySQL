/* Copyright (c) 2022-2024 Reminano */

const moment = require('moment');
const GameRecordsResourceAccess = require('../../resourceAccess/GameRecordsResourceAccess');
const GamePlayRecordsResourceAccess = require('../../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const AppUserMissionPlayResourceAccess = require('../../../GamePlayRecords/resourceAccess/AppUserMissionPlayResourceAccess');
const AppUserMissionHistoryResourceAccess = require('../../../AppUserMission/resourceAccess/AppUserMissionHistoryResourceAccess');
const GamePlayRecordsFunctions = require('../../../GamePlayRecords/GamePlayRecordsFunctions');
const { BET_TYPE, BET_STATUS, GAME_RECORD_UNIT_BO, BET_RESULT, BET_VALUE, GAME_ID } = require('../../../GamePlayRecords/GamePlayRecordsConstant');

const GameInfoResourceAccess = require('../../../GameInfo/resourceAccess/GameInfoResourceAccess');
const { closeMission, updateUserMissionInfo, updateMissionHistoryStatus } = require('../../../AppUserMission/AppUserMissionFunction');
const {
  getTimeDiffPerSectionByGame,
  getFutureGameSection,
  getFutureGameSectionIndex,
  isPlayGameRecord,
  getLatestGameRecord,
  getCurrentGameSection,
} = require('../../GameRecordFunctions');
const { createMissionBonusRecordForUser } = require('../../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
const { MISSION_STATUS, MISSION_DAY_DATA_FORMAT } = require('../../../AppUserMission/AppUserMissionConstant');
const Logger = require('../../../../utils/logging');
const { GAME_STATUS } = require('../../../GameInfo/GameInfoConstant');
const { GAME_RECORD_STATUS } = require('../../GameRecordConstant');
const { publishJSONToClient } = require('../../../../ThirdParty/SocketIO/SocketIOClient');

async function addFutureGameRecord(gameRecordType, gameUnit, numberOfRecord = 10) {
  for (let i = 0; i < numberOfRecord; i++) {
    let _futureGameSection = getFutureGameSection(GAME_ID.BINARYOPTION, gameRecordType, gameUnit, i);
    let _futureGameSectionIndex = getFutureGameSectionIndex(gameRecordType, i);
    let _newGameRecord = {
      gameRecordSection: _futureGameSection,
      gameRecordType: gameRecordType,
      gameRecordUnit: gameUnit,
      gameRecordValue: 0,
      isPlayGameRecord: _futureGameSectionIndex % 2 === 0 ? 1 : 0,
      gameRecordStatus: BET_STATUS.NEW,
      gameRecordNote: `Auto tạo`,
    };
    try {
      _result = await GameRecordsResourceAccess.insert(_newGameRecord);
    } catch (error) {
      //by-pass if insert duplicated
    }
  }

  return _result;
}

async function updateLatestGameResult(gameRecordSection, gameRecordType, gameRecordValue, gameUnit) {
  const _existingGameRecord = await GameRecordsResourceAccess.find({
    gameRecordSection: gameRecordSection,
    gameRecordType: gameRecordType,
    gameRecordUnit: gameUnit,
  });

  let marketData = gameRecordValue;
  const open = parseFloat(marketData.split(';')[3]);
  const close = parseFloat(marketData.split(';')[4]);
  const isUp = _checkUpdown(close, open);

  let _isPlayGameRecord = isPlayGameRecord(gameRecordSection);

  if (_isPlayGameRecord) {
    GamePlayRecordsFunctions.refreshCachedTotalBetAmountInByUser(gameRecordType);
    GamePlayRecordsFunctions.refreshCachedTotalBetMissionAmountInByUser(gameRecordType);
    GamePlayRecordsFunctions.cleanAllLiveRecordByBetType(gameRecordType);
    await Promise.all([
      GamePlayRecordsFunctions.refreshCacheTotalBetAmountInByBetType(gameRecordType, BET_VALUE.BINARYOPTION.TANG),
      GamePlayRecordsFunctions.refreshCacheTotalBetAmountInByBetType(gameRecordType, BET_VALUE.BINARYOPTION.GIAM),
    ]);
  }
  let _resultGameRecord = undefined;
  let _result = undefined;
  if (_existingGameRecord && _existingGameRecord.length > 0) {
    _resultGameRecord = _existingGameRecord[0];
    _updateData = {
      gameRecordValue: gameRecordValue,
      gameRecordResult: isUp,
      isPlayGameRecord: _isPlayGameRecord,
      gameRecordStatus: BET_STATUS.PENDING,
    };
    _result = await GameRecordsResourceAccess.updateById(_resultGameRecord.gameRecordId, _updateData);
    _resultGameRecord = {
      ..._resultGameRecord,
      ..._updateData,
    };

    return _resultGameRecord.gameRecordId;
  } else {
    _resultGameRecord = {
      gameRecordSection: gameRecordSection,
      gameRecordType: gameRecordType,
      gameRecordUnit: gameUnit,
      gameRecordValue: gameRecordValue,
      gameRecordResult: isUp,
      isPlayGameRecord: _isPlayGameRecord,
      gameRecordStatus: BET_STATUS.PENDING,
      gameRecordNote: `Auto tạo`,
    };

    _result = await GameRecordsResourceAccess.insert(_resultGameRecord);

    if (_result) {
      return _result[0];
    }
  }
}

async function updateWinLoseResultForBetRecord(gameSection) {
  try {
    await Promise.all([
      _checkWinLoseResultForPlayRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_15S, GAME_RECORD_UNIT_BO.BTC),
      _checkWinLoseResultForPlayRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_45S, GAME_RECORD_UNIT_BO.BTC),
      _checkWinLoseResultForPlayRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_60S, GAME_RECORD_UNIT_BO.BTC),
      _checkWinLoseResultForPlayRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_90S, GAME_RECORD_UNIT_BO.BTC),
      _checkWinLoseResultForPlayRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_180S, GAME_RECORD_UNIT_BO.BTC),
      _checkWinLoseResultForPlayRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN, GAME_RECORD_UNIT_BO.BTC),
    ])
      .then()
      .catch(error => Logger.error(`${new Date()}-[Error]: Update win/lose binaryoption up/down game record error`, error));
  } catch (error) {
    Logger.info(error);
  }
}

async function updateWinLoseResultForMission(gameSection) {
  try {
    // // await Promise.all([
    await checkWinLoseResultForMissionRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_15S, GAME_RECORD_UNIT_BO.BTC);
    await checkWinLoseResultForMissionRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_45S, GAME_RECORD_UNIT_BO.BTC);
    await checkWinLoseResultForMissionRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_60S, GAME_RECORD_UNIT_BO.BTC);
    await checkWinLoseResultForMissionRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_90S, GAME_RECORD_UNIT_BO.BTC);
    await checkWinLoseResultForMissionRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN_180S, GAME_RECORD_UNIT_BO.BTC);
    await checkWinLoseResultForMissionRecord(gameSection, BET_TYPE.BINARYOPTION_UPDOWN, GAME_RECORD_UNIT_BO.BTC);
    // ]);
  } catch (error) {
    Logger.info(error);
  }
}

async function _checkWinLoseResultForPlayRecord(gameSection, betType, coinType) {
  if (gameSection.indexOf(betType) < 0) {
    Logger.info(`SKIP _checkWinLoseResultForPlayRecord ${gameSection} ${betType} ${coinType} ${new Date()}`);
    return;
  }
  Logger.info(`_checkWinLoseResultForPlayRecord ${gameSection} ${betType} ${coinType} ${new Date()}`);
  const gameRecordToUpdate = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: gameSection,
      gameRecordType: betType,
      gameRecordUnit: coinType,
      isPlayGameRecord: 1,
    },
    0,
    1,
    {
      key: 'gameRecordSection',
      value: 'asc',
    },
  );
  if (gameRecordToUpdate && gameRecordToUpdate.length > 0) {
    const gameRecord = gameRecordToUpdate[0];
    let gamePlayRecordCount = 50;
    let gamePlayRecordSkip = 0;
    while (gamePlayRecordCount > 0) {
      const gamePlayRecords = await GamePlayRecordsResourceAccess.customSearch(
        {
          betRecordSection: gameRecord.gameRecordSection,
          betRecordType: betType,
          betRecordStatus: [BET_STATUS.NEW, BET_STATUS.PENDING, BET_STATUS.WAITING],
        },
        gamePlayRecordSkip,
        gamePlayRecordCount,
      );
      console.log('gamePlayRecords: ', gamePlayRecords);
      if (gamePlayRecords && gamePlayRecords.length > 0) {
        gamePlayRecordSkip += gamePlayRecords.length;
        for (let index = 0; index < gamePlayRecords.length; index++) {
          const gamePlayRecord = gamePlayRecords[index];
          //tinh toan ket qua thang thua => tien
          const moneyReceived = await _checkWinLoseResult(gameRecord, gamePlayRecord);
          //xu ly tra thuong => cap nhat game play record + cong tien wallet + thong bao user
          await GamePlayRecordsFunctions.updateWinLoseForBetGame(gamePlayRecord, moneyReceived);
        }
      } else {
        gamePlayRecordCount = 0;
      }
    }
  }
  Logger.info(`FINISH _checkWinLoseResultForPlayRecord ${gameSection} ${betType} ${coinType} ${new Date()}`);
}

async function checkWinLoseResultForMissionRecord(gameSection, betType, coinType) {
  Logger.info(`checkWinLoseResultForMissionRecord ${gameSection} ${betType} ${coinType} ${new Date()}`);
  const gameRecordToUpdate = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: gameSection,
      gameRecordType: betType,
      gameRecordUnit: coinType,
      isPlayGameRecord: 1,
    },
    0,
    1,
    {
      key: 'gameRecordSection',
      value: 'asc',
    },
  );

  if (gameRecordToUpdate && gameRecordToUpdate.length > 0) {
    const gameRecord = gameRecordToUpdate[0];
    let gamePlayRecordCount = 50;
    let gamePlayRecordSkip = 0;

    while (true) {
      const gamePlayRecords = await AppUserMissionPlayResourceAccess.customSearch(
        {
          betRecordSection: gameRecord.gameRecordSection,
          betRecordType: betType,
          betRecordStatus: [BET_STATUS.NEW, BET_STATUS.PENDING, BET_STATUS.WAITING],
        },
        gamePlayRecordSkip,
        gamePlayRecordCount,
      );
      gamePlayRecordSkip += gamePlayRecordCount;
      if (gamePlayRecords && gamePlayRecords.length > 0) {
        for (let index = 0; index < gamePlayRecords.length; index++) {
          const _missionPlayRecord = gamePlayRecords[index];
          //tinh toan ket qua thang thua => tien
          const moneyReceived = await _checkWinLoseResult(gameRecord, _missionPlayRecord);
          //xu ly tra thuong => cap nhat game play record + cong tien wallet + thong bao user
          await GamePlayRecordsFunctions.updateWinLoseForMission(_missionPlayRecord, moneyReceived);
          await closeMission(_missionPlayRecord.appUserMissionHistoryId);
          await createMissionBonusRecordForUser(_missionPlayRecord.appUserId);
          await updateUserMissionInfo(_missionPlayRecord.appUserId);
        }
      } else {
        break;
      }
    }
  }
  Logger.info(`FINISH checkWinLoseResultForMissionRecord ${gameSection} ${betType} ${coinType} ${new Date()}`);
}

async function _checkWinLoseResult(gameRecord, gamePlayRecord) {
  let winAmount = 0;
  if (gamePlayRecord.betRecordValue == gameRecord.gameRecordResult) {
    const winRate = await _getWinRateConfig(gamePlayRecord.betRecordValue);
    winAmount = gamePlayRecord.betRecordAmountIn * winRate;
  } else if (gameRecord.gameRecordResult === BET_VALUE.BINARYOPTION.HOA) {
    winAmount = 0;
  } else {
    winAmount = -gamePlayRecord.betRecordAmountIn;
  }
  return winAmount;
}

async function _getWinRateConfig(gameValue) {
  //TODO: sử dụng cache Redis
  try {
    const gameId = parseInt(GAME_ID.BINARYOPTION);
    const gameInfo = await GameInfoResourceAccess.findById(gameId);
    let winRate = 0.9;
    if (gameInfo) {
      const configRates = JSON.parse(gameInfo.gameConfigWinRate);
      if (configRates) {
        for (let index = 0; index < configRates.length; index++) {
          const configRate = configRates[index];
          if (configRate.gameRecordResultType == gameValue) {
            winRate = configRate.winRate - 1;
          }
        }
      }
    }
    return winRate;
  } catch (error) {
    Logger.error(`Fail to get winrate config: ${error}`);
    return 0.9;
  }
}

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

async function _remakeNewPlayGameRecord(gameRecordSection, gameRecordType) {
  console.info(`_remakeNewPlayGameRecord ${gameRecordSection} ${new Date()}`);
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

    let gameValue = latestClosePrice;
    gameRecordValue = `${gameValue};0;0;${gameRecordValue.open};${gameRecordValue.close};${gameRecordValue.high};${gameRecordValue.low};${gameRecordValue.volume}`;

    let _newGameRecord = {
      gameRecordSection: gameRecordSection,
      gameRecordType: gameRecordType,
      gameRecordUnit: GAME_RECORD_UNIT_BO.BTC,
      gameRecordValue: gameRecordValue,
      gameRecordResult: BET_VALUE.BINARYOPTION.HOA,
      isPlayGameRecord: 1,
      gameRecordStatus: GAME_RECORD_STATUS.COMPLETED,
      gameRecordNote: `Hoàn tiền ${new Date()}`,
      gameInfoId: GAME_ID.BINARYOPTION,
    };

    await GameRecordsResourceAccess.insert(_newGameRecord);
    publishJSONToClient('REMAKE_GAMEPLAYRECORD', 'REMAKE_GAMEPLAYRECORD');
  }
}

async function _isExistingGameRecord(gameRecordSection, gameRecordType) {
  let _existingGameRecord = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: gameRecordSection,
      gameRecordType: gameRecordType,
    },
    0,
    1,
  );
  if (_existingGameRecord && _existingGameRecord.length > 0) {
    return _existingGameRecord[0];
  } else {
    return undefined;
  }
}
async function _isOldRecordToUpdate(gamePlayRecordSection, gameRecordType, betUnit) {
  gamePlayRecordSection = gamePlayRecordSection.split('-')[0];

  gamePlayRecordSection = moment(gamePlayRecordSection, 'YYYYMMDDhhmmss');

  let currentGameSections = getCurrentGameSection(GAME_ID.BINARYOPTION, gameRecordType, betUnit).split('-')[0];
  currentGameSections = moment(currentGameSections, 'YYYYMMDDhhmmss');

  let diff = currentGameSections.diff(gamePlayRecordSection, 'second');

  let timeToCompare = getTimeDiffPerSectionByGame(gameRecordType);
  // lấy số giây x với số kỳ (ở đây là 3 kỳ để tránh bị lỗi đang trong thời gian chờ kỳ chưa xổ mà đã remake lại kết quả)
  const numOfSection = 3;
  timeToCompare = timeToCompare * numOfSection;
  if (diff >= timeToCompare) {
    return true;
  } else {
    return false;
  }
}
async function updateAllOldRecordByBetType(betRecordType) {
  let limit = 1;
  let skip = 0;
  let _oldGameRecordTime = moment().format();
  while (true) {
    const _gamePlayRecordList = await GamePlayRecordsResourceAccess.customSearch(
      {
        betRecordStatus: [BET_STATUS.NEW, BET_STATUS.PENDING, BET_STATUS.WAITING],
        betRecordType: betRecordType,
      },
      skip,
      limit,
      undefined,
      _oldGameRecordTime,
    );

    if (_gamePlayRecordList && _gamePlayRecordList.length > 0) {
      for (let i = 0; i < _gamePlayRecordList.length; i++) {
        let _existingGameRecord = await _isExistingGameRecord(_gamePlayRecordList[i].betRecordSection, betRecordType);
        if (!_existingGameRecord) {
          // kiểm tra kỳ đặt lệnh >3 so với kỳ hiện tại
          let isOldRecordToUpdate = await _isOldRecordToUpdate(
            _gamePlayRecordList[i].betRecordSection,
            betRecordType,
            _gamePlayRecordList[i].betRecordUnit,
          );
          if (!isOldRecordToUpdate) {
            continue;
          }
          await _remakeNewPlayGameRecord(_gamePlayRecordList[i].betRecordSection, betRecordType);
        }
        await updateWinLoseResultForBetRecord(_gamePlayRecordList[i].betRecordSection);
      }
      skip += limit;
    } else {
      break;
    }
  }
}
// updateAllOldRecordByBetType('BINARYOPTION_UPDOWN_15S')
async function updateAllOldMissionRecordByBetType(betRecordType) {
  Logger.info(`START updateAllOldMissionRecordByBetType ${betRecordType} ${new Date()}`);
  let limit = 1;
  let skip = 0;
  let _oldGameRecordTime = moment().add(-1, 'minute').format();
  while (true) {
    const _appUserMissionPlayList = await AppUserMissionPlayResourceAccess.customSearch(
      {
        betRecordStatus: [BET_STATUS.NEW, BET_STATUS.PENDING, BET_STATUS.WAITING],
        betRecordType: betRecordType,
      },
      skip,
      limit,
      undefined,
      _oldGameRecordTime,
    );
    skip += limit;
    if (_appUserMissionPlayList && _appUserMissionPlayList.length > 0) {
      for (let i = 0; i < _appUserMissionPlayList.length; i++) {
        Logger.log(`_appUserMissionPlayList ${_appUserMissionPlayList[i].betRecordSection}`);
        let _existingGameRecord = await _isExistingGameRecord(_appUserMissionPlayList[i].betRecordSection, betRecordType);
        if (!_existingGameRecord) {
          let isOldRecordToUpdate = await _isOldRecordToUpdate(
            _appUserMissionPlayList[i].betRecordSection,
            betRecordType,
            _appUserMissionPlayList[i].betRecordUnit,
          );
          if (!isOldRecordToUpdate) {
            continue;
          }
          await _remakeNewPlayGameRecord(_appUserMissionPlayList[i].betRecordSection, betRecordType);
        }
        const gameRecordToUpdate = await GameRecordsResourceAccess.find(
          {
            gameRecordSection: _appUserMissionPlayList[i].betRecordSection,
            gameRecordType: betRecordType,
            gameRecordUnit: GAME_RECORD_UNIT_BO.BTC,
            isPlayGameRecord: 1,
          },
          0,
          1,
          {
            key: 'gameRecordSection',
            value: 'asc',
          },
        );
        if (gameRecordToUpdate && gameRecordToUpdate.length > 0) {
          await checkWinLoseResultForMissionRecord(_appUserMissionPlayList[i].betRecordSection, betRecordType, GAME_RECORD_UNIT_BO.BTC);
        }
        // else {
        //   await AppUserMissionPlayResourceAccess.updateById(_appUserMissionPlayList[i].betRecordId, {
        //     betRecordStatus: BET_STATUS.COMPLETED,
        //     betRecordResult: BET_RESULT.LOSE,
        //   });
        //   await closeMission(_appUserMissionPlayList[i].appUserMissionHistoryId);
        //   // }
        // }
      }
    } else {
      break;
    }
  }
  Logger.info(`FINISH updateAllOldMissionRecordByBetType ${betRecordType} ${new Date()}`);
}

async function updateAllOldMissionHistory() {
  Logger.info(`START updateAllOldMissionHistory ${new Date()}`);
  let limit = 5;
  let skip = 0;

  while (true) {
    const _appUserMissionHistoryList = await AppUserMissionHistoryResourceAccess.customSearch(
      {
        missionStatus: [MISSION_STATUS.IN_PROGRESS],
        missionStartDay: moment().format(MISSION_DAY_DATA_FORMAT),
      },
      skip,
      limit,
    );

    if (_appUserMissionHistoryList && _appUserMissionHistoryList.length > 0) {
      for (let i = 0; i < _appUserMissionHistoryList.length; i++) {
        await updateMissionHistoryStatus(_appUserMissionHistoryList[i].appUserMissionHistoryId);
      }
      skip += limit;
    } else {
      break;
    }
  }
  Logger.info(`FINISH updateAllOldMissionHistory ${new Date()}`);
}

module.exports = {
  addFutureGameRecord,
  checkWinLoseResultForMissionRecord,
  updateLatestGameResult,
  updateWinLoseResultForBetRecord,
  updateWinLoseResultForMission,
  updateAllOldRecordByBetType,
  updateAllOldMissionRecordByBetType,
  updateAllOldMissionHistory,
};
