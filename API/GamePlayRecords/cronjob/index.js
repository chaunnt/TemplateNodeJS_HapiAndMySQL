const utilFunctions = require('../../ApiUtils/utilFunctions');
const { GAME_RECORD_UNIT_BO, BET_TYPE, BET_VALUE, GAME_ID } = require('../GamePlayRecordsConstant');
const { checkIfNowisPlayGameRecord, botPlaceNewBet } = require('../GamePlayRecordsFunctions');
const Logger = require('../../../utils/logging');

let _randomBetAmountArr = [];
const POINT_TO_VND = 1000;
function resetBetValueArr() {
  Logger.info(`resetBetValueArr`);
  for (let i = 0; i < 30; i++) {
    _randomBetAmountArr.push(utilFunctions.randomIntByMinMax(20, 100) * POINT_TO_VND);
  }
  for (let i = 0; i < 20; i++) {
    _randomBetAmountArr.push(utilFunctions.randomIntByMinMax(100, 200) * POINT_TO_VND);
  }
  for (let i = 0; i < 20; i++) {
    _randomBetAmountArr.push(utilFunctions.randomIntByMinMax(200, 500) * POINT_TO_VND);
  }
  for (let i = 0; i < 20; i++) {
    _randomBetAmountArr.push(utilFunctions.randomIntByMinMax(500, 2000) * POINT_TO_VND);
  }
  for (let i = 0; i < 5; i++) {
    _randomBetAmountArr.push(utilFunctions.randomIntByMinMax(2000, 5000) * POINT_TO_VND);
  }
  for (let i = 0; i < 5; i++) {
    _randomBetAmountArr.push(utilFunctions.randomIntByMinMax(5000, 10000) * POINT_TO_VND);
  }

  _randomBetAmountArr = utilFunctions.shuffleArrayRandom(_randomBetAmountArr);
  _randomBetAmountArr = utilFunctions.shuffleArrayRandom(_randomBetAmountArr);
}
resetBetValueArr();
if (process.env.WORKER_ENABLE * 1 === 1) {
  setInterval(() => {
    resetBetValueArr();
  }, 30 * 1000);
}

async function _randomPlaceBetGameBO(betRecordType, betRecordUnit) {
  const betValue = utilFunctions.randomIntByMinMax(0, 1000);
  const gameValue = betValue.toString();
  let lastIndexGameValue = gameValue.length > 1 ? gameValue[gameValue.length - 1] : gameValue;
  const betPlace = parseInt(lastIndexGameValue) > 4 ? BET_VALUE.BINARYOPTION.TANG : BET_VALUE.BINARYOPTION.GIAM;

  if (_randomBetAmountArr.length <= 0) {
    resetBetValueArr();
  }
  const _betRecordAmountIn = _randomBetAmountArr.pop();

  return {
    gameInfoId: GAME_ID.BINARYOPTION,
    betAmountIn: _betRecordAmountIn,
    betPlace: betPlace,
    betRecordAmountIn: _betRecordAmountIn,
    betRecordType: betRecordType,
    betRecordUnit: betRecordUnit,
  };
}

async function botPlaceBet() {
  for (let i = 0; i < 5; i++) {
    let counter = utilFunctions.randomIntByMinMax(100, 1000);
    let betRecordFake15;
    let betRecordFake45;
    let betRecordFake180;
    let betRecordFake90;
    let betRecordFake60;
    if (counter % 5 === 0) {
      betRecordFake45 = await _randomPlaceBetGameBO(BET_TYPE.BINARYOPTION_UPDOWN_45S, GAME_RECORD_UNIT_BO.BTC);
      // betRecordFake60 = await _randomPlaceBetGameBO(BET_TYPE.BINARYOPTION_UPDOWN_60S, GAME_RECORD_UNIT_BO.BTC);
      betRecordFake180 = await _randomPlaceBetGameBO(BET_TYPE.BINARYOPTION_UPDOWN_180S, GAME_RECORD_UNIT_BO.BTC);
    } else if (counter % 3 === 0) {
      betRecordFake45 = await _randomPlaceBetGameBO(BET_TYPE.BINARYOPTION_UPDOWN_45S, GAME_RECORD_UNIT_BO.BTC);
    }
    betRecordFake15 = await _randomPlaceBetGameBO(BET_TYPE.BINARYOPTION_UPDOWN_15S, GAME_RECORD_UNIT_BO.BTC);
    await Promise.all([
      botPlaceNewBet(betRecordFake15),
      botPlaceNewBet(betRecordFake45),
      botPlaceNewBet(betRecordFake180),
      // botPlaceNewBet(betRecordFake60),
    ])
      .then()
      .catch(e => {
        Logger.error(e);
      });
  }
}
module.exports = {
  botPlaceBet,
};
