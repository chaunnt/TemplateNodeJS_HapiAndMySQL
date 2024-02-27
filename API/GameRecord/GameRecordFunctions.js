/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const GameRecordsResourceAccess = require('./resourceAccess/GameRecordsResourceAccess');
const GamePlayRecordsResource = require('../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const CustomerMessageResourceAccess = require('../CustomerMessage/resourceAccess/CustomerMessageResourceAccess');
const utilFunctions = require('../ApiUtils/utilFunctions');
const {
  GAME_RECORD_STATUS,
  GAME_RATIO,
  GAME_RECORD_TYPE,
  GAME_RESULT,
  KENO_RESULT,
  XOSOSIEUTOC_RESULT,
  GAME_SECTION_TIME_DISPLAY_FORMAT,
  GAME_SECTION_START_TIME,
} = require('./GameRecordConstant');
const moment = require('moment');
const { BET_STATUS, BET_TYPE, GAME_ID, GAME_RECORD_UNIT_BO } = require('../GamePlayRecords/GamePlayRecordsConstant');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');
const { MESSAGE_STATUS, MESSAGE_TOPIC, MESSAGE_TYPE } = require('../CustomerMessage/CustomerMessageConstant');
const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
const CustomerMessageFunctions = require('../CustomerMessage/CustomerMessageFunctions');
const Logger = require('../../utils/logging');

let _cacheAssignedGameRecord = {};
function getGameSectionTimeDiff(betRecordType) {
  let _GameSectionTimeDiff = 0;
  switch (betRecordType) {
    case BET_TYPE.BINARYOPTION_UPDOWN_15S:
      _GameSectionTimeDiff = 15;
      break;
    case BET_TYPE.BINARYOPTION_UPDOWN_45S:
      _GameSectionTimeDiff = 45;
      break;
    case BET_TYPE.BINARYOPTION_UPDOWN_90S:
      _GameSectionTimeDiff = 90;
      break;
    case BET_TYPE.BINARYOPTION_UPDOWN_180S:
      _GameSectionTimeDiff = 180;
      break;
    case BET_TYPE.BINARYOPTION_UPDOWN_60S:
      _GameSectionTimeDiff = 60;
      break;
    default:
      _GameSectionTimeDiff = 60;
      break;
  }
  return _GameSectionTimeDiff;
}

function getCurrentGameSection(gameId, betRecordType, gameUnit) {
  let _nextGameSectionIndex = getCurrentGameSectionIndex(betRecordType);
  let _gameSectionDuration = getGameSectionTimeDiff(betRecordType);
  let _gameSectionMoment = moment(GAME_SECTION_START_TIME, 'YYYYMMDD')
    .startOf('year')
    .add(_nextGameSectionIndex * _gameSectionDuration, 'second')
    .format(GAME_SECTION_TIME_DISPLAY_FORMAT);
  let _gameSection = `${_gameSectionMoment}-${gameId}-${gameUnit}-${betRecordType}`;
  return _gameSection;
}

function getCurrentGameSectionIndex(betRecordType) {
  return getLastGameSectionIndex(betRecordType) + 1;
}

function getLastGameSection(gameId, betRecordType, gameUnit) {
  let _nextGameSectionIndex = getLastGameSectionIndex(betRecordType);
  let _gameSectionDuration = getGameSectionTimeDiff(betRecordType);
  let _gameSectionMoment = moment(GAME_SECTION_START_TIME, 'YYYYMMDD')
    .startOf('year')
    .add(_nextGameSectionIndex * _gameSectionDuration, 'second')
    .format(GAME_SECTION_TIME_DISPLAY_FORMAT);
  let _gameSection = `${_gameSectionMoment}-${gameId}-${gameUnit}-${betRecordType}`;
  return _gameSection;
}

function getFutureGameSection(gameId, betRecordType, gameUnit, nextSectionCount = 1) {
  let _nextGameSectionIndex = getCurrentGameSectionIndex(betRecordType) + nextSectionCount;
  let _gameSectionDuration = getGameSectionTimeDiff(betRecordType);
  let _gameSectionMoment = moment(GAME_SECTION_START_TIME, 'YYYYMMDD')
    .startOf('year')
    .add(_nextGameSectionIndex * _gameSectionDuration, 'second')
    .format(GAME_SECTION_TIME_DISPLAY_FORMAT);
  let _gameSection = `${_gameSectionMoment}-${gameId}-${gameUnit}-${betRecordType}`;
  return _gameSection;
}

function getFutureGameSectionIndex(betRecordType, nextSectionCount = 1) {
  let _nextGameSectionIndex = getCurrentGameSectionIndex(betRecordType) + nextSectionCount;
  return _nextGameSectionIndex;
}

function getLastGameSectionIndex(betRecordType) {
  let _timeDiff = moment(GAME_SECTION_START_TIME, 'YYYYMMDD').startOf('year').diff(moment(), 'seconds') * -1;
  let _gameSectionDuration = getGameSectionTimeDiff(betRecordType);
  return Math.floor(_timeDiff / _gameSectionDuration);
}

function generateGameRecordValue(charCount, minValue = 0, maxValue = 9) {
  let _randomValue = '';
  for (let i = 0; i < charCount; i++) {
    _randomValue += utilFunctions.randomIntByMinMax(minValue, maxValue);
  }
  return _randomValue;
}

function generateResultXososieutoc() {
  let _randomValue = '';
  const G8 = generateGameRecordValue(2);
  _randomValue += `${G8};`;
  const G7 = generateGameRecordValue(3);
  _randomValue += `${G7};`;
  for (let i = 0; i < 3; i++) {
    const G6 = generateGameRecordValue(4);
    _randomValue += `${G6};`;
  }
  const G5 = generateGameRecordValue(4);
  _randomValue += `${G5};`;
  for (let i = 0; i < 7; i++) {
    const G4 = generateGameRecordValue(5);
    _randomValue += `${G4};`;
  }
  for (let i = 0; i < 2; i++) {
    const G3 = generateGameRecordValue(5);
    _randomValue += `${G3};`;
  }
  const G2 = generateGameRecordValue(5);
  _randomValue += `${G2};`;
  const G1 = generateGameRecordValue(5);
  _randomValue += `${G1};`;
  const GDB = generateGameRecordValue(6);
  _randomValue += `${GDB}`;
  return _randomValue;
}

function generateResultKeno() {
  let _randomValue = '';
  for (let i = 0; i <= 19; i++) {
    const numberRandom = utilFunctions.randomIntByMinMax(1, 80);
    if (numberRandom < 10) {
      _randomValue += `0${numberRandom}`;
    } else {
      _randomValue += `${numberRandom}`;
    }
    if (i < 19) {
      _randomValue += ';';
    }
  }
  return _randomValue;
}

async function addNewGameRecord(gameRecordSection, gameRecordType, gameRecordValue, staff) {
  let existedGameRecord = await GameRecordsResourceAccess.find(
    {
      gameRecordSection: gameRecordSection,
      gameRecordType: gameRecordType,
    },
    0,
    1,
  );

  //if it was predefined by admin, then update status to display it
  if (existedGameRecord && existedGameRecord.length > 0) {
    existedGameRecord = existedGameRecord[0];
    return existedGameRecord;
  }

  //else add new records
  let newRecordData = {
    gameRecordSection: gameRecordSection,
    gameRecordType: gameRecordType,
  };

  if (staff) {
    newRecordData.gameRecordNote = 'Admin tạo';
  } else {
    newRecordData.gameRecordNote = 'Auto tạo';
  }

  //neu admin dien ket qua truoc thi luu ket qua lai
  if (gameRecordValue) {
    newRecordData.gameRecordValue = gameRecordValue;
  }

  let newRecord = await GameRecordsResourceAccess.insert(newRecordData);
  return newRecord;
}

function checkGameRecordResult(price) {
  let priceString = price + '';
  let lastValue = priceString[priceString.length - 1];
  let betUp = 0;
  let betDown = 0;
  let betOdd = 0;
  let betEven = 0;
  if (lastValue * 1 < 5) {
    betDown = 1;
  } else {
    betUp = 1;
  }

  if (lastValue % 2 === 0) {
    betEven = 1;
  } else {
    betOdd = 1;
  }

  let result = {
    gameRecordTypeUp: betUp,
    gameRecordTypeDown: betDown,
    gameRecordTypeOdd: betOdd,
    gameRecordTypeEven: betEven,
  };
  return result;
}

function _detectBatchResult(existedGameRecord, existedBetRecord) {
  let _gameRecordValue = existedGameRecord.gameRecordValue;
  let result = [];
  let gameValues = _gameRecordValue.split(';');
  const betRecordValue = existedBetRecord.betRecordValue;
  const existedBetRecordNum2 = betRecordValue.slice(betRecordValue.length - 2);
  const existedBetRecordNum3 = betRecordValue.slice(betRecordValue.length - 3);
  const existedBetRecordNum4 = betRecordValue.slice(betRecordValue.length - 4);
  const existedBetRecordNum5 = betRecordValue.slice(betRecordValue.length - 5);

  if (gameValues.includes(existedBetRecordNum2)) {
    // giải 8 gồm 2 số trùng nhau
    result.push(GAME_RESULT.G8);
  }

  if (gameValues.includes(existedBetRecordNum3)) {
    // giải 7 gồm 3 số trùng nhau
    result.push(GAME_RESULT.G7);
  }

  if (gameValues[2] === existedBetRecordNum4 || gameValues[3] === existedBetRecordNum4 || gameValues[4] === existedBetRecordNum4) {
    result.push(GAME_RESULT.G6); // giải 6 gồm 4 số trùng nhau
  }

  if (gameValues[5] === existedBetRecordNum4) {
    result.push(GAME_RESULT.G5); // giải 5 gồm 4 số trùng nhau
  }

  if (
    gameValues[6] === existedBetRecordNum5 ||
    gameValues[7] === existedBetRecordNum5 ||
    gameValues[8] === existedBetRecordNum5 ||
    gameValues[9] === existedBetRecordNum5 ||
    gameValues[10] === existedBetRecordNum5 ||
    gameValues[11] === existedBetRecordNum5 ||
    gameValues[12] === existedBetRecordNum5
  ) {
    // giải 4 gồm 5 số trùng nhau
    result.push(GAME_RESULT.G4);
  }

  if (gameValues[13] === existedBetRecordNum5 || gameValues[14] === existedBetRecordNum5) {
    // giải 3 gồm 5 số trùng nhau
    result.push(GAME_RESULT.G3);
  }

  if (gameValues[15] === existedBetRecordNum5) {
    result.push(GAME_RESULT.G2); // giải 2 gồm 5 số trùng nhau
  }

  if (gameValues[16] === existedBetRecordNum5) {
    result.push(GAME_RESULT.G1); // giải 1 gồm 5 số trùng nhau
  }

  const gameValuesNum5 = gameValues[17].slice(gameValues[17].length - 5);
  if (gameValuesNum5 === existedBetRecordNum5) {
    // nêú giống giốngg5 số cuối của vé cặp là
    result.push(GAME_RESULT.GDB); // có 11 vé trúng giải đăc biệt
    result.push(GAME_RESULT.GPDB); // có 99 vé trúng giải phụ đặc biệt
  }

  let count = 0;
  for (let i = 0; i < existedBetRecordNum5.length; i++) {
    // so sách xem số ở mỗi hàng có bằng nhau không VD 1234 và 1235 (1 vs 1, 2 vs 2, 3 vs 3, 4 vs 5)
    if (existedBetRecordNum5[i] === gameValuesNum5[i]) {
      count++;
    }
  }

  // nếu sai một số trong 5 số cuối của giải đặc biệt thì trúng giải khuyến khích
  if (count === 4) {
    result.push(GAME_RESULT.GKK);
  }

  let pointWin = 0;
  if (result.includes(GAME_RESULT.G8)) {
    pointWin = pointWin + 100000 * 110;
  }

  if (result.includes(GAME_RESULT.G7)) {
    pointWin = pointWin + 200000 * 110;
  }

  if (result.includes(GAME_RESULT.G6)) {
    pointWin = pointWin + 400000 * 110;
  }

  if (result.includes(GAME_RESULT.G5)) {
    pointWin = pointWin + 1000000 * 110;
  }

  if (result.includes(GAME_RESULT.G4)) {
    pointWin = pointWin + 3000000 * 110;
  }

  if (result.includes(GAME_RESULT.G3)) {
    pointWin = pointWin + 10000000 * 110;
  }

  if (result.includes(GAME_RESULT.G2)) {
    pointWin = pointWin + 15000000 * 110;
  }

  if (result.includes(GAME_RESULT.G1)) {
    pointWin = pointWin + 30000000 * 110;
  }

  if (result.includes(GAME_RESULT.GDB)) {
    pointWin = pointWin + 2500000000 * 11;
  }

  if (result.includes(GAME_RESULT.GPDB)) {
    pointWin = pointWin + 50000000 * 99;
  }

  if (result.includes(GAME_RESULT.GKK)) {
    pointWin = pointWin + 6000000 * 11;
  }

  return { pointWin, result };
}

function _detectSingleResult(existedGameRecord, existedBetRecord) {
  let _gameRecordValue = existedGameRecord.gameRecordValue;
  let result = [];
  let gameValues = _gameRecordValue.split(';');
  const betRecordValue = existedBetRecord.betRecordValue;
  const betRecordQuantity = existedBetRecord.betRecordQuantity;
  const existedBetRecordNum2 = betRecordValue.slice(betRecordValue.length - 2);
  const existedBetRecordNum3 = betRecordValue.slice(betRecordValue.length - 3);
  const existedBetRecordNum4 = betRecordValue.slice(betRecordValue.length - 4);
  const existedBetRecordNum5 = betRecordValue.slice(betRecordValue.length - 5);

  if (gameValues.includes(existedBetRecordNum2)) {
    // giải 8 gồm 2 số trùng nhau
    result.push(GAME_RESULT.G8);
  }

  if (gameValues.includes(existedBetRecordNum3)) {
    // giải 7 gồm 3 số trùng nhau
    result.push(GAME_RESULT.G7);
  }

  if (gameValues[2] === existedBetRecordNum4 || gameValues[3] === existedBetRecordNum4 || gameValues[4] === existedBetRecordNum4) {
    result.push(GAME_RESULT.G6); // giải 6 gồm 4 số trùng nhau
  }

  if (gameValues[5] === existedBetRecordNum4) {
    result.push(GAME_RESULT.G5); // giải 5 gồm 4 số trùng nhau
  }

  if (
    gameValues[6] === existedBetRecordNum5 ||
    gameValues[7] === existedBetRecordNum5 ||
    gameValues[8] === existedBetRecordNum5 ||
    gameValues[9] === existedBetRecordNum5 ||
    gameValues[10] === existedBetRecordNum5 ||
    gameValues[11] === existedBetRecordNum5 ||
    gameValues[12] === existedBetRecordNum5
  ) {
    // giải 4 gồm 5 số trùng nhau
    result.push(GAME_RESULT.G4);
  }

  if (gameValues[13] === existedBetRecordNum5 || gameValues[14] === existedBetRecordNum5) {
    // giải 3 gồm 5 số trùng nhau
    result.push(GAME_RESULT.G3);
  }

  if (gameValues[15] === existedBetRecordNum5) {
    result.push(GAME_RESULT.G2); // giải 2 gồm 5 số trùng nhau
  }

  if (gameValues[16] === existedBetRecordNum5) {
    result.push(GAME_RESULT.G1); // giải 1 gồm 5 số trùng nhau
  }

  if (gameValues[17] === betRecordValue) {
    result.push(GAME_RESULT.GDB); // giải đặc biệt là phải giống hết
  }

  const gameValuesNum5 = gameValues[17].slice(gameValues[17].length - 5);
  if (gameValuesNum5 === existedBetRecordNum5 && !result.includes(GAME_RESULT.GDB)) {
    // giải phụ đặc biệt là phải giống5 số cuối với giải đặc biệt
    result.push(GAME_RESULT.GPDB); // và không trúng giải đặc biệt
  }

  let count = 0;
  for (let i = 0; i < existedBetRecordNum5.length; i++) {
    // so sách xem số ở mỗi hàng có bằng nhau không VD 1234 và 1235 (1 vs 1, 2 vs 2, 3 vs 3, 4 vs 5)
    if (existedBetRecordNum5[i] === gameValuesNum5[i]) {
      count++;
    }
  }

  // nếu sai một số trong 5 số cuối của giải đặc biệt thì trúng giải khuyến khích
  if (count === 4) {
    result.push(GAME_RESULT.GKK);
  }

  let pointWin = 0;
  if (result.includes(GAME_RESULT.G8)) {
    pointWin = pointWin + 100000;
  }

  if (result.includes(GAME_RESULT.G7)) {
    pointWin = pointWin + 200000;
  }

  if (result.includes(GAME_RESULT.G6)) {
    pointWin = pointWin + 400000;
  }

  if (result.includes(GAME_RESULT.G5)) {
    pointWin = pointWin + 1000000;
  }

  if (result.includes(GAME_RESULT.G4)) {
    pointWin = pointWin + 3000000;
  }

  if (result.includes(GAME_RESULT.G3)) {
    pointWin = pointWin + 10000000;
  }

  if (result.includes(GAME_RESULT.G2)) {
    pointWin = pointWin + 15000000;
  }

  if (result.includes(GAME_RESULT.G1)) {
    pointWin = pointWin + 30000000;
  }

  if (result.includes(GAME_RESULT.GDB)) {
    pointWin = pointWin + 2500000000;
  }

  if (result.includes(GAME_RESULT.GPDB)) {
    pointWin = pointWin + 50000000;
  }

  if (result.includes(GAME_RESULT.GKK)) {
    pointWin = pointWin + 6000000;
  }

  pointWin = pointWin * betRecordQuantity;

  return { pointWin, result };
}

async function completeNonPlayGameRecordByType(gameRecordType) {
  await GameRecordsResourceAccess.updateAll(
    {
      gameRecordType: gameRecordType,
      isPlayGameRecord: 0,
      gameRecordStatus: GAME_RECORD_STATUS.PENDING,
    },
    {
      gameRecordStatus: GAME_RECORD_STATUS.COMPLETED,
    },
  );
}

async function completeGameRecordById(gameRecordId) {
  await GameRecordsResourceAccess.updateById(gameRecordId, {
    gameRecordStatus: GAME_RECORD_STATUS.COMPLETED,
  });
}

async function completeGameRecord(gameRecordSection, gameRecordType) {
  Logger.info(`completeGameRecord ${gameRecordSection} ${gameRecordType}`);

  let existedGameRecord = await GameRecordsResourceAccess.find({
    gameRecordSection: gameRecordSection,
    gameRecordType: gameRecordType,
  });

  if (existedGameRecord && existedGameRecord.length > 0) {
    existedGameRecord = existedGameRecord[0];

    let updateRecordData = {
      gameRecordStatus: GAME_RECORD_STATUS.COMPLETED,
    };
    GameRecordsResourceAccess.updateById(existedGameRecord.gameRecordId, updateRecordData);
  } else {
    Logger.error(`can not find game to complete ${gameRecordSection} ${gameRecordType}`);
  }

  let existedGamePlayRecords = await GamePlayRecordsResource.find({
    betRecordSection: gameRecordSection,
  });

  //if it was predefined by admin, then update status to display it
  let result;
  let pointWin = 0;
  if (existedGamePlayRecords && existedGamePlayRecords.length > 0) {
    for (let i = 0; i < existedGamePlayRecords.length; i++) {
      //kiem tra ket qua vé đơn
      const betRecordType = existedGamePlayRecords[i].betRecordType;
      if (betRecordType === GAME_RECORD_TYPE.SINGLE) {
        result = _detectSingleResult(existedGameRecord, existedGamePlayRecords[i]);
      } else if (betRecordType === GAME_RECORD_TYPE.BATCH) {
        // kiem tra ket qua vé cặp
        result = _detectBatchResult(existedGameRecord, existedGamePlayRecords[i]);
      }
      //cap nhat ket qua vao csdl
      pointWin = result.pointWin;
      let updateBetRecordData = {
        betRecordStatus: BET_STATUS.COMPLETED,
        betRecordWin: pointWin ? pointWin : 0,
      };

      let updateProductData = {
        productCategory: `${result.result}`,
      };

      await GamePlayRecordsResource.updateById(existedGamePlayRecords[i].betRecordId, updateBetRecordData);

      if (pointWin && pointWin > 0) {
        let result = await rewardToWinner(existedGamePlayRecords[i].appUserId, pointWin);
        if (result) {
          let notifiTitle = 'Trúng thưởng xổ số';
          let notifiContent = `Chúc mừng bạn đã trưởng thưởng xổ số ${pointWin} đồng. Thông tin vé: đài ${gameRecordType} loại vé ${existedGamePlayRecords.betRecordType} với số vé ${existedGamePlayRecords.betRecordValue}`;
          await CustomerMessageFunctions.sendNotificationUser(appUserId, notifiTitle, notifiContent);
        }
      }
    }
  }
}

async function rewardToWinner(appUserId, betRecordWin) {
  const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
  //tra thuong cho user
  WalletRecordFunction.increasePointBalance(appUserId, betRecordWin);
}

async function getCurrentGameRecord(gameRecordType) {
  let filter = {
    gameRecordType: gameRecordType,
  };
  let skip = 0;
  let limit = 1;
  let order = {
    key: 'gameRecordSection',
    value: 'asc',
  };

  filter.gameRecordStatus = GAME_RECORD_STATUS.NEW;

  let gameRecords = await GameRecordsResourceAccess.find(filter, skip, limit, order);
  if (gameRecords && gameRecords.length > 0) {
    return gameRecords[0];
  } else {
    return undefined;
  }
}

async function getLatestGameRecord(gameRecordType) {
  let filter = {
    gameRecordType: gameRecordType,
  };
  let skip = 0;
  let limit = 1;
  let order = {
    key: 'gameRecordSection',
    value: 'desc',
  };

  filter.gameRecordStatus = GAME_RECORD_STATUS.COMPLETED;

  let gameRecords = await GameRecordsResourceAccess.find(filter, skip, limit, order);
  if (gameRecords && gameRecords.length > 0) {
    return gameRecords[0];
  } else {
    return undefined;
  }
}

async function completeAllPendingGameRecord() {
  let currentSection = moment().format('YYYYMMDD');

  let existedGameRecord = await GameRecordsResourceAccess.find({
    gameRecordStatus: GAME_RECORD_STATUS.NEW,
  });
  for (let i = 0; i < existedGameRecord.length; i++) {
    const _record = existedGameRecord[i];
    //neu ky da qua thoi gian thi se tu dong complete
    await completeGameRecord(_record.gameRecordSection, _record.gameRecordType);
  }
}

function _kenoBasic(betValue, gameRecordValue) {
  let numberOfWinningNumbers = 0;
  let amount = 0;
  for (let i = 0; i < betValue.length; i++) {
    if (gameRecordValue.includes(betValue[i])) {
      numberOfWinningNumbers++;
    }
  }
  if (KENO_RESULT[`BASIC_${betValue.length}_${numberOfWinningNumbers}`]) {
    amount = KENO_RESULT[`BASIC_${betValue.length}_${numberOfWinningNumbers}`];
  } else {
    amount = 0;
  }
  return amount;
}

function _kenoBigSmall(gameRecordValue) {
  let numberFrom1To40 = 0;
  let numberFrom41To80 = 0;
  let amount = 0;
  for (let i = 0; i < gameRecordValue.length; i++) {
    if (gameRecordValue[i] <= 40) {
      numberFrom1To40++;
    } else {
      numberFrom41To80++;
    }
  }

  if (numberFrom41To80 >= 13) {
    amount = KENO_RESULT.BIGSMALL_BIG_13;
  } else if (numberFrom41To80 == 11 || numberFrom1To40 == 12) {
    amount = KENO_RESULT.BIGSMALL_BIG_11_12;
  } else if (numberFrom1To40 == numberFrom41To80) {
    amount = KENO_RESULT.BIGSMALL_10_10;
  } else if (numberFrom1To40 == 11 || numberFrom1To40 == 12) {
    amount = KENO_RESULT.BIGSMALL_SMALL_11_12;
  } else if (numberFrom1To40 >= 13) {
    amount = KENO_RESULT.BIGSMALL_SMALL_13;
  } else {
    amount = 0;
  }
  return amount;
}

function _kenoEvenOdd(gameRecordValue) {
  let numberOfEvenNumbers = 0;
  let numberOfOddNumbers = 0;
  let amount = 0;
  for (let i = 0; i < gameRecordValue.length; i++) {
    if (gameRecordValue[i] % 2 == 0) {
      numberOfEvenNumbers++;
    } else {
      numberOfOddNumbers++;
    }
  }

  if (numberOfEvenNumbers >= 15) {
    amount = KENO_RESULT.EVENODD_EVEN_15;
  } else if (numberOfEvenNumbers == 13 || numberOfEvenNumbers == 14) {
    amount = KENO_RESULT.EVENODD_EVEN_13_14;
  } else if (numberOfEvenNumbers == 11 || numberOfEvenNumbers == 12) {
    amount = KENO_RESULT.EVENODD_EVEN_11_12;
  } else if (numberOfEvenNumbers == numberOfOddNumbers) {
    amount = KENO_RESULT.EVENODD_10_10;
  } else if (numberOfOddNumbers == 11 || numberOfOddNumbers == 12) {
    amount = KENO_RESULT.EVENODD_ODD_11_12;
  } else if (numberOfOddNumbers == 13 || numberOfOddNumbers == 14) {
    amount = KENO_RESULT.EVENODD_ODD_13_14;
  } else if (numberOfOddNumbers >= 15) {
    amount = KENO_RESULT.EVENODD_ODD_15;
  } else {
    amount = 0;
  }
  return amount;
}

function _calculatePrizesAndMoney(betValue, gameRecordValue) {
  let amount = 0; //tiền nhận được
  //keno cơ bản
  amount = _kenoBasic(betValue, gameRecordValue);
  //keno Lớn/NHỏ
  if (amount <= _kenoBigSmall(gameRecordValue)) {
    amount = _kenoBigSmall(gameRecordValue);
  }
  //keno Chẵn/Lẻ
  if (amount <= _kenoEvenOdd(gameRecordValue)) {
    amount = _kenoEvenOdd(gameRecordValue);
  }

  return amount * 10000;
}

async function _updateResultOnGamePlayRecord(gamePlayRecord, amount, gameRecordId) {
  await GamePlayRecordsResource.updateById(gamePlayRecord.betRecordId, {
    betRecordWin: amount - gamePlayRecord.betRecordAmountIn,
    betRecordStatus: BET_STATUS.COMPLETED,
    gameInfoId: gameRecordId,
    betRecordAmountOut: amount,
  });
}

async function _updateUserWalletAndNotification(gamePlayRecord, amount) {
  if (amount != 0) {
    const wallet = await UserWallet.find(
      {
        appUserId: gamePlayRecord.appUserId,
        walletType: WALLET_TYPE.POINT,
      },
      0,
      1,
    );

    if (wallet && wallet.length > 0) {
      await CustomerMessageResourceAccess.insert({
        customerMessageSendStatus: MESSAGE_STATUS.NEW,
        customerMessageTopic: MESSAGE_TOPIC.USER,
        customerMessageType: MESSAGE_TYPE.USER,
        customerId: gamePlayRecord.appUserId,
        customerMessageTitle: 'Thông báo kết quả game',
        customerMessageContent: `Bạn đã trúng thưởng ${amount.toLocaleString('en-EN')} vào kỳ ${gamePlayRecord.gameRecordSection} game ${
          gamePlayRecord.gameRecordType
        }`,
      });
      await UserWallet.incrementBalance(wallet[0].walletId, amount);
    }
  } else {
    await CustomerMessageResourceAccess.insert({
      customerMessageSendStatus: MESSAGE_STATUS.NEW,
      customerMessageTopic: MESSAGE_TOPIC.USER,
      customerMessageType: MESSAGE_TYPE.USER,
      customerId: gamePlayRecord.appUserId,
      customerMessageTitle: 'Thông báo kết quả game',
      customerMessageContent: `Chúc bạn may mắn lần sau. Bạn đã không trúng thưởng vào kỳ ${gamePlayRecord.gameRecordSection} game ${gamePlayRecord.gameRecordType}`,
    });
  }
}

async function checkResultKeno1P(gamePlayRecords, gameRecord) {
  for (let i = 0; i < gamePlayRecords.length; i++) {
    let amount = 0;
    const betValue = gamePlayRecords[i].betRecordValue.split(/;/);
    const gameRecordValue = gameRecord.gameRecordValue.split(/;/);
    if (betValue.length > 0) {
      amount = _calculatePrizesAndMoney(betValue, gameRecordValue);
      amount = amount * (gamePlayRecords[i].betRecordAmountIn / 10000); // tỉ lệ = giá vé / 10k (giải thưởng tính theo 10k)
    }
    //update result and money on GamePlayRecord
    await _updateResultOnGamePlayRecord(gamePlayRecords[i], amount, gameRecord.gameRecordId);
    //update user wallet with amount and notify to user
    await _updateUserWalletAndNotification(gamePlayRecords[i], amount);
    //update betRecordPaymentBonusStatus on GamePlayRecord
    await GamePlayRecordsResource.updateById(gamePlayRecords[i].betRecordId, {
      betRecordPaymentBonusStatus: BET_STATUS.COMPLETED,
    });
  }
}

function _xoSoSieuTocBasic(betValue, gameRecordValue) {
  let amount = 0;
  for (let i = gameRecordValue.length - 1; i >= 0; i--) {
    // lấy những số cuối của betValue để tính giải thưởng (từ giải đặc biệt -> giải 8)
    const subBetValue = betValue.slice(-gameRecordValue[i].length);
    if (subBetValue == gameRecordValue[i]) {
      switch (i) {
        case 17: {
          amount = XOSOSIEUTOC_RESULT.GDB;
          break;
        }
        case 16: {
          amount = XOSOSIEUTOC_RESULT.G1;
          break;
        }
        case 15: {
          amount = XOSOSIEUTOC_RESULT.G2;
          break;
        }
        case 14:
        case 13: {
          amount = XOSOSIEUTOC_RESULT.G3;
          break;
        }
        case 12:
        case 11:
        case 10:
        case 9:
        case 8:
        case 7:
        case 6: {
          amount = XOSOSIEUTOC_RESULT.G4;
          break;
        }
        case 5: {
          amount = XOSOSIEUTOC_RESULT.G5;
          break;
        }
        case 4:
        case 3:
        case 2: {
          amount = XOSOSIEUTOC_RESULT.G6;
          break;
        }
        case 1: {
          amount = XOSOSIEUTOC_RESULT.G7;
          break;
        }
        case 0: {
          amount = XOSOSIEUTOC_RESULT.G8;
          break;
        }
      }
      // vì lặp giải từ lớn đến nhỏ => có giải thì thoát khỏi vòng lặp
      break;
    }
  }

  //tính giải an ủi và khuyến khích
  const lastValue = gameRecordValue[gameRecordValue.length - 1];
  //giải an ủi
  if (betValue.slice(-5) == lastValue.slice(-5) && amount < XOSOSIEUTOC_RESULT.GAU) {
    amount = XOSOSIEUTOC_RESULT.GAU;
  }
  //giải khuyến khích
  if (betValue[0] == lastValue[0] && amount < XOSOSIEUTOC_RESULT.GKK) {
    let diffNumbers = 0;
    const subBetValue = betValue.slice(-5);
    const subLastValue = lastValue.slice(-5);
    for (let i = 0; i < subBetValue.length; i++) {
      if (subBetValue[i] != subLastValue[i]) {
        diffNumbers++;
      }
    }
    if (diffNumbers == 1) {
      amount = XOSOSIEUTOC_RESULT.GKK;
    }
  }
  return amount * 10000;
}

// bao lô, lô 2,3,4
function _xoSoSieuTocBaoLo(betValue, gameRecordValue, lotNumber) {
  let amount = 0;
  let numberOfWin = 0; // số lần trúng thưởng
  for (let i = 0; i < gameRecordValue.length; i++) {
    const lastDigits = gameRecordValue[i].slice(-lotNumber);
    if (betValue.includes(lastDigits)) {
      numberOfWin++;
    }
  }

  return amount;
}

// Lô xiên, xiên 2,3,4
function _xoSoSieuTocLoXien(betValue, gameRecordValue, betRecordType) {
  const betValueCopy = [...betValue];
  let amount = 0;
  let numberOfWin = 0;
  for (let i = 0; i < gameRecordValue.length; i++) {
    const lastTwoDigits = gameRecordValue[i].slice(-2);
    if (betValueCopy.includes(lastTwoDigits)) {
      numberOfWin++;
      const index = betValueCopy.indexOf(lastTwoDigits);
      betValueCopy.splice(index, 1);
    }
    if (betValueCopy.length == 0) {
      break;
    }
  }

  if (BET_TYPE.XSST1P_LOXIEN_XIEN2 == betRecordType && numberOfWin == 2 && betValue.length == 2) {
    // tính tiền xổ số xiên 2
  } else if (BET_TYPE.XSST1P_LOXIEN_XIEN3 == betRecordType && numberOfWin == 3 && betValue.length == 3) {
    // tinh tiền xổ số xiên 3
  } else if (BET_TYPE.XSST1P_LOXIEN_XIEN4 == betRecordType && numberOfWin == 4 && betValue.length == 4) {
    // tính tiền xổ số xiên 4
  }

  return amount;
}

// Đánh đề
function _xoSoSieuTocDeDauGiaiNhat(betValue, gameRecordValue) {
  let amount = 0;
  const lastTwoDigitsOfFirstPrize = gameRecordValue[gameRecordValue.length - 2].slice(0, 2);
  if (betValue.includes(lastTwoDigitsOfFirstPrize)) {
    // trung giai
  }

  return amount;
}

function _xoSoSieuTocDeDauDacBiet(betValue, gameRecordValue) {
  let amount = 0;
  const lastTwoDigitsOfFirstPrize = gameRecordValue[gameRecordValue.length - 1].slice(0, 2);
  if (betValue.includes(lastTwoDigitsOfFirstPrize)) {
    // trúng giải
  }

  return amount;
}

function _xoSoSieuTocDeDacBiet(betValue, gameRecordValue) {
  let amount = 0;
  const lastTwoDigitsOfFirstPrize = gameRecordValue[gameRecordValue.length - 1].slice(-2);
  if (betValue.includes(lastTwoDigitsOfFirstPrize)) {
    // trúng giải
  }

  return amount;
}

function _xoSoSieuTocDeDau(betValue, gameRecordValue) {
  let amount = 0;

  if (betValue.includes(gameRecordValue[0])) {
    // trúng giải
  }

  return amount;
}

function _xoSoSieuTocDeDauDuoi(betValue, gameRecordValue) {
  let amount = 0;
  const eighthPrize = gameRecordValue[0];
  const lastTwoDigitsOfJackpot = gameRecordValue[gameRecordValue.length - 1].slice(-2);

  if (betValue.includes(lastTwoDigitsOfJackpot) && betValue.includes(eighthPrize)) {
    // trúng gấp đôi
  } else if (betValue.includes(eighthPrize) || betValue.includes(lastTwoDigitsOfJackpot)) {
    // trúng giải
  }

  return amount;
}

// xổ số siêu tốc đầu đuôi / đầu hoặc đuôi
function _xoSoSieuTocDauDuoi(betValue, gameRecordValue, betRecordType) {
  let amount = 0;
  const lastTwoDigitsOfJackpot = gameRecordValue[gameRecordValue.length - 1].slice(-2);
  if (BET_TYPE.XSST1P_DAUDUOI_DAU == betRecordType && betValue.includes(lastTwoDigitsOfJackpot[0])) {
    // trung giai đầu đuôi/đầu
  } else if (BET_TYPE.XSST1P_DAUDUOI_DUOI == betRecordType && betValue.includes(lastTwoDigitsOfJackpot[1])) {
    // trung giai dau duoi/duoi
  }

  return amount;
}

//xổ số siêu tốc 3 càng
function _xoSoSieuTocBaCang(betValue, gameRecordValue, betRecordType) {
  let amount = 0;
  const lastThreeDigitsOfJackpot = gameRecordValue[gameRecordValue.length - 1].slice(-3);
  const seventhPrize = gameRecordValue[1];

  if (BET_TYPE.XSST1P_3CANG_DAU == betRecordType && betValue.includes(seventhPrize)) {
    // trung giai 3 càng đầu
  } else if (BET_TYPE.XSST1P_3CANG_DACBIET == betRecordType && betValue.includes(lastThreeDigitsOfJackpot)) {
    // trúng giải 3 càng đặc biệt
  } else if (BET_TYPE.XSST1P_3CANG_DAUDUOI == betRecordType) {
    if (seventhPrize == lastThreeDigitsOfJackpot && betValue.includes(seventhPrize)) {
      // trúng giải 3 càng đầu đuôi gấp đôi
    } else if (betValue.includes(seventhPrize) || betValue.includes(lastThreeDigitsOfJackpot)) {
      // trungs giaỉ 3 càng đàu đuôi
    }
  }

  return amount;
}

// xổ số siêu tốc 4 càng
function _xoSoSieuTocBonCang(betValue, gameRecordValue) {
  let amount = 0;
  const lastFourDigitsOfJackpot = gameRecordValue[gameRecordValue.length - 1].slice(-4);

  if (betValue.includes(lastFourDigitsOfJackpot)) {
    // trung giai 4 cang
  }

  return amount;
}

// xổ số siêu tốc trượt xiên 4,8,10
function _xoSoSieuTocTruotXien(betValue, gameRecordValue, betRecordType) {
  let amount = 0;
  let numberOfIntersections = 0;
  const newGameRecordValue = gameRecordValue.map(value => value.slice(-2));

  for (let i = 0; i < betValue.length; i++) {
    if (newGameRecordValue.includes(betValue[i])) {
      numberOfIntersections++;
      break;
    }
  }

  if (numberOfIntersections == 0) {
    if (BET_TYPE.XSST1P_LOTRUOT_XIEN4 == betRecordType && betValue.length == 4) {
      // trung giai trượt xiên 4
    } else if (BET_TYPE.XSST1P_LOTRUOT_XIEN8 == betRecordType && betValue.length == 8) {
      // trúng giải trượt xiên 8
    } else if (BET_TYPE.XSST1P_LOTRUOT_XIEN10 == betRecordType && betValue.length == 10) {
      // trúng giải trượt xiên 10
    }
  }

  return amount;
}

async function checkResultXososieutoc(gamePlayRecords, gameRecord) {
  for (let i = 0; i < gamePlayRecords.length; i++) {
    let amount = 0;

    const betValue = gamePlayRecords[i].betRecordValue.split(/;/);
    const gameRecordValue = gameRecord.gameRecordValue.split(/;/);
    switch (gamePlayRecords[i].betRecordType) {
      case BET_TYPE.XSTT_DEFAULT:
      case BET_TYPE.XSST1P_DEFAULT: {
        const betRecordValue = gamePlayRecords[i].betRecordValue;
        amount = _xoSoSieuTocBasic(betRecordValue, gameRecordValue);
        amount = amount * (gamePlayRecords[i].betRecordAmountIn / 10000); // tỉ lệ = giá vé / 10k (giải thưởng tính theo 10k thực tế)
        break;
      }
      case BET_TYPE.XSTT_BAOLO_LO2:
      case BET_TYPE.XSST1P_BAOLO_LO2: {
        amount = _xoSoSieuTocBaoLo(betValue, gameRecordValue, 2);
        break;
      }
      case BET_TYPE.XSTT_BAOLO_LO3:
      case BET_TYPE.XSST1P_BAOLO_LO3: {
        amount = _xoSoSieuTocBaoLo(betValue, gameRecordValue, 3);
        break;
      }
      case BET_TYPE.XSTT_BAOLO_LO4:
      case BET_TYPE.XSST1P_BAOLO_LO4: {
        amount = _xoSoSieuTocBaoLo(betValue, gameRecordValue, 4);
        break;
      }
      case BET_TYPE.XSTT_LOXIEN_XIEN2:
      case BET_TYPE.XSTT_LOXIEN_XIEN3:
      case BET_TYPE.XSTT_LOXIEN_XIEN4:
      case BET_TYPE.XSST1P_LOXIEN_XIEN2:
      case BET_TYPE.XSST1P_LOXIEN_XIEN3:
      case BET_TYPE.XSST1P_LOXIEN_XIEN4: {
        amount = _xoSoSieuTocLoXien(betValue, gameRecordValue, gamePlayRecords[i].betRecordType);
        break;
      }
      case BET_TYPE.XSTT_DE_DEDAUGIAINHAT:
      case BET_TYPE.XSST1P_DE_DEDAUGIAINHAT: {
        amount = _xoSoSieuTocDeDauGiaiNhat(betValue, gameRecordValue);
        break;
      }
      case BET_TYPE.XSTT_DE_DEDAUDACBIET:
      case BET_TYPE.XSST1P_DE_DEDAUDACBIET: {
        amount = _xoSoSieuTocDeDauDacBiet(betValue, gameRecordValue);
        break;
      }
      case BET_TYPE.XSTT_DE_DEDACBIET:
      case BET_TYPE.XSST1P_DE_DEDACBIET: {
        amount = _xoSoSieuTocDeDacBiet(betValue, gameRecordValue);
        break;
      }
      case BET_TYPE.XSTT_DE_DAU:
      case BET_TYPE.XSST1P_DE_DAU: {
        amount = _xoSoSieuTocDeDau(betValue, gameRecordValue);
        break;
      }
      case BET_TYPE.XSTT_DE_ĐAUDUOI:
      case BET_TYPE.XSST1P_DE_ĐAUDUOI: {
        amount = _xoSoSieuTocDeDauDuoi(betValue, gameRecordValue);
        break;
      }
      case BET_TYPE.XSTT_DAUDUOI_DAU:
      case BET_TYPE.XSTT_DAUDUOI_DUOI:
      case BET_TYPE.XSST1P_DAUDUOI_DAU:
      case BET_TYPE.XSST1P_DAUDUOI_DUOI: {
        amount = _xoSoSieuTocDauDuoi(betValue, gameRecordValue, gamePlayRecords[i].betRecordType);
        break;
      }
      case BET_TYPE.XSTT_3CANG_DAU:
      case BET_TYPE.XSTT_3CANG_DACBIET:
      case BET_TYPE.XSTT_3CANG_DAUDUOI:
      case BET_TYPE.XSST1P_3CANG_DAU:
      case BET_TYPE.XSST1P_3CANG_DACBIET:
      case BET_TYPE.XSST1P_3CANG_DAUDUOI: {
        amount = _xoSoSieuTocBaCang(betValue, gameRecordValue, gamePlayRecords[i].betRecordType);
        break;
      }
      case BET_TYPE.XSTT_4CANG_DACBIET:
      case BET_TYPE.XSST1P_4CANG_DACBIET: {
        amount = _xoSoSieuTocBonCang(betValue, gameRecordValue);
        break;
      }
      case BET_TYPE.XSTT_LOTRUOT_XIEN4:
      case BET_TYPE.XSTT_LOTRUOT_XIEN8:
      case BET_TYPE.XSTT_LOTRUOT_XIEN10:
      case BET_TYPE.XSST1P_LOTRUOT_XIEN4:
      case BET_TYPE.XSST1P_LOTRUOT_XIEN8:
      case BET_TYPE.XSST1P_LOTRUOT_XIEN10: {
        amount = _xoSoSieuTocTruotXien(betValue, gameRecordValue, gamePlayRecords[i].betRecordType);
        break;
      }
      default: {
        const betValue = gamePlayRecords[i].betRecordValue;
        const gameRecordValue = gameRecord.gameRecordValue.split(/;/);
        amount = _xoSoSieuTocBasic(betValue, gameRecordValue);
        amount = amount * (gamePlayRecords[i].betRecordAmountIn / 10000); // tỉ lệ = giá vé / 10k (giải thưởng tính theo 10k thực tế)
      }
    }
    //update result and money on GamePlayRecord
    await _updateResultOnGamePlayRecord(gamePlayRecords[i], amount, gameRecord.gameRecordId);
    //update user wallet with amount and notify to user
    await _updateUserWalletAndNotification(gamePlayRecords[i], amount);
    //update betRecordPaymentBonusStatus on GamePlayRecord
    await GamePlayRecordsResource.updateById(gamePlayRecords[i].betRecordId, {
      betRecordPaymentBonusStatus: BET_STATUS.COMPLETED,
    });
  }
}

function getTimeDiffPerSectionByGame(gameRecordType) {
  let diffSecondPerSection = 60;
  if (gameRecordType === BET_TYPE.BINARYOPTION_UPDOWN_60S) {
    diffSecondPerSection = 60;
  }
  // else if (gameRecordType === BET_TYPE.BINARYOPTION_UPDOWN_5S) {
  //   diffSecondPerSection = 5;
  // }
  else if (gameRecordType === BET_TYPE.BINARYOPTION_UPDOWN_15S) {
    diffSecondPerSection = 15;
  } else if (gameRecordType === BET_TYPE.BINARYOPTION_UPDOWN_45S) {
    diffSecondPerSection = 45;
  }
  //  else if (gameRecordType === BET_TYPE.BINARYOPTION_UPDOWN_30S) {
  //   diffSecondPerSection = 30;
  // }
  else if (gameRecordType === BET_TYPE.BINARYOPTION_UPDOWN_180S) {
    diffSecondPerSection = 180;
  } else if (gameRecordType === BET_TYPE.BINARYOPTION_UPDOWN_90S) {
    diffSecondPerSection = 90;
  } else {
    diffSecondPerSection = 60;
  }
  return diffSecondPerSection;
}

function isPlayGameRecord(gameRecordSection) {
  let _section = gameRecordSection.split('-')[0];
  let _gameRecordType = gameRecordSection.split('-');
  _gameRecordType = _gameRecordType[_gameRecordType.length - 1];
  let _sectionDiff = moment(_section, GAME_SECTION_TIME_DISPLAY_FORMAT).unix() - moment(GAME_SECTION_START_TIME, 'YYYYMMDD').startOf('day').unix();
  let _timeDiffPerSection = getTimeDiffPerSectionByGame(_gameRecordType);

  let _sectionIndex = parseInt(_sectionDiff / _timeDiffPerSection);
  let _isPlayGameRecord = 0;

  if (_sectionIndex % 2 === 0) {
    _isPlayGameRecord = 1;
  }
  return _isPlayGameRecord;
}

function isPlayGameRecordByType(gameRecordType) {
  let _gameRecordSection = getCurrentGameSection(GAME_ID.BINARYOPTION, gameRecordType, GAME_RECORD_UNIT_BO.BTC);
  let _section = _gameRecordSection.split('-')[0];
  let _sectionDiff = moment(_section, GAME_SECTION_TIME_DISPLAY_FORMAT).unix() - moment(GAME_SECTION_START_TIME, 'YYYYMMDD').startOf('day').unix();
  let _timeDiffPerSection = getTimeDiffPerSectionByGame(gameRecordType);

  let _sectionIndex = parseInt(_sectionDiff / _timeDiffPerSection);
  let _isPlayGameRecord = 0;

  if (_sectionIndex % 2 === 0) {
    _isPlayGameRecord = 1;
  }
  return _isPlayGameRecord;
}

function addAssignedGameRecordToCached(gameRecord) {
  const _cachedKey = `${gameRecord.gameRecordSection}`;
  _cacheAssignedGameRecord[_cachedKey] = gameRecord;
}

function clearAssignedGameRecordToCached(gameRecordSection) {
  const _cachedKey = `${gameRecordSection}`;
  _cacheAssignedGameRecord[_cachedKey] = {};
}

function getAssignedGameRecordFromCached(gameRecordSection) {
  const _cachedKey = `${gameRecordSection}`;
  return _cacheAssignedGameRecord[_cachedKey];
}
module.exports = {
  addAssignedGameRecordToCached,
  addNewGameRecord,
  clearAssignedGameRecordToCached,
  completeGameRecord,
  generateGameRecordValue,
  generateResultKeno,
  getAssignedGameRecordFromCached,
  checkGameRecordResult,
  getCurrentGameRecord,
  getLatestGameRecord,
  getLastGameSection,
  getFutureGameSection,
  getFutureGameSectionIndex,
  getCurrentGameSection,
  getTimeDiffPerSectionByGame,
  getGameSectionTimeDiff,
  isPlayGameRecord,
  isPlayGameRecordByType,
  completeAllPendingGameRecord,
  _detectBatchResult,
  _detectSingleResult,
  checkResultKeno1P,
  generateResultXososieutoc,
  checkResultXososieutoc,
  completeGameRecordById,
  completeNonPlayGameRecordByType,
};
