/* Copyright (c) 2023 Reminano */

const { randomIntByMinMax, isNotEmptyStringValue, shuffleArrayRandom, randomFloatByMinMax } = require('../../../ApiUtils/utilFunctions');
const {
  BET_TYPE,
  BET_VALUE,
  GAME_RECORD_UNIT_BO,
  GAME_RECORD_UNIT_CRYPTO_IDX,
  GAME_ID,
} = require('../../../GamePlayRecords/GamePlayRecordsConstant');
const { GAME_SECTION_TIME_DISPLAY_FORMAT, GAME_SECTION_START_TIME } = require('../../GameRecordConstant');
const {
  getGameSectionTimeDiff,
  getCurrentGameSection,
  getAssignedGameRecordFromCached,
  getLastGameSection,
  getTimeDiffPerSectionByGame,
} = require('../../GameRecordFunctions');
const moment = require('moment');
let cachePriceHistoryOriginData = {};
let cachePriceData = {};
let cachePriceHistoryData = {};
let cacheVolumeHistoryData = {};
const initPriceData = {
  open: 0,
  close: 0,
  high: 0,
  low: 0,
  volume: 0,
};

const MAX_RATE = 0.025;
for (let j = 0; j < Object.keys(GAME_RECORD_UNIT_BO).length; j++) {
  const _keyUnit = Object.keys(GAME_RECORD_UNIT_BO)[j];
  for (let i = 0; i < Object.keys(BET_TYPE).length; i++) {
    const _betType = Object.keys(BET_TYPE)[i];
    cacheVolumeHistoryData[`${_betType}_${GAME_RECORD_UNIT_BO[_keyUnit]}`] = [];
    cachePriceHistoryData[`${_betType}_${GAME_RECORD_UNIT_BO[_keyUnit]}`] = {};
    cachePriceHistoryOriginData[`${_betType}_${GAME_RECORD_UNIT_BO[_keyUnit]}`] = {};
  }
}

for (let j = 0; j < Object.keys(GAME_RECORD_UNIT_BO).length; j++) {
  const _keyUnit = Object.keys(GAME_RECORD_UNIT_BO)[j];
  for (let i = 0; i < Object.keys(BET_TYPE).length; i++) {
    const _betType = Object.keys(BET_TYPE)[i];
    cachePriceData[`${_betType}_${GAME_RECORD_UNIT_BO[_keyUnit]}`] = JSON.parse(JSON.stringify(initPriceData));
    cachePriceData[`${GAME_RECORD_UNIT_BO[_keyUnit]}`] = JSON.parse(JSON.stringify(initPriceData));
  }
}

for (let j = 0; j < Object.keys(GAME_RECORD_UNIT_CRYPTO_IDX).length; j++) {
  const _keyUnit = Object.keys(GAME_RECORD_UNIT_CRYPTO_IDX)[j];
  for (let i = 0; i < Object.keys(BET_TYPE).length; i++) {
    const _betType = Object.keys(BET_TYPE)[i];
    cachePriceData[`${_betType}_${GAME_RECORD_UNIT_CRYPTO_IDX[_keyUnit]}`] = JSON.parse(JSON.stringify(initPriceData));
    cachePriceData[`${GAME_RECORD_UNIT_CRYPTO_IDX[_keyUnit]}`] = JSON.parse(JSON.stringify(initPriceData));
  }
}

function _cacheDataByUnit(cryptoName, openPrice, closePrice, highPrice, lowPrice, tradeVolume) {
  const _cachedPriceKey = `${GAME_RECORD_UNIT_BO[cryptoName]}`;
  if (cachePriceData[_cachedPriceKey].open === 0) {
    cachePriceData[_cachedPriceKey].open = openPrice;
  }

  cachePriceData[_cachedPriceKey].close = closePrice;

  if (highPrice && cachePriceData[_cachedPriceKey].high < highPrice) {
    cachePriceData[_cachedPriceKey].high = highPrice;
  }

  if (lowPrice && cachePriceData[_cachedPriceKey].low === 0) {
    cachePriceData[_cachedPriceKey].low = lowPrice;
  } else if (lowPrice && cachePriceData[_cachedPriceKey].low > lowPrice) {
    cachePriceData[_cachedPriceKey].low = lowPrice;
  }
  cachePriceData[_cachedPriceKey].volume += tradeVolume;
}

function _storeHistoryPrice(key, closePrice, maxStack = 540) {
  //tang them 3 giay de lay ket qua cham hon binannce 3 giay để đảm bảo luôn luôn có giá trả về
  const DELAY_TIME_SECOND = 3;

  cachePriceHistoryData[`${key}`][`${moment().add(DELAY_TIME_SECOND, 'second').format(GAME_SECTION_TIME_DISPLAY_FORMAT)}`] = {
    closePrice: closePrice,
  };

  cachePriceHistoryOriginData[`${key}`][`${moment().add(DELAY_TIME_SECOND, 'second').format(GAME_SECTION_TIME_DISPLAY_FORMAT)}`] = {
    closePrice: closePrice,
  };

  let _cacheLength = Object.keys(cachePriceHistoryData[`${key}`]).length;
  if (_cacheLength > maxStack) {
    let _oldestKey = Object.keys(cachePriceHistoryData[`${key}`])[0];
    delete cachePriceHistoryData[`${key}`][`${_oldestKey}`];
    delete cachePriceHistoryOriginData[`${key}`][`${_oldestKey}`];
  }
}

function _storeHistoryVolume(key, volume, maxStack = 540) {
  cacheVolumeHistoryData[`${key}`].push(volume);
  if (cacheVolumeHistoryData[`${key}`].length > maxStack) {
    cacheVolumeHistoryData[`${key}`].slice(1);
  }
}

function _cacheData(betType, cryptoName, openPrice, closePrice, highPrice, lowPrice, tradeVolume) {
  const _cachedPriceKey = `${betType}_${GAME_RECORD_UNIT_BO[cryptoName]}`;

  //3 loai 60s - 180s - 90s thi se theo data that, nguoc lai se theo data ao
  if (betType !== BET_TYPE.BINARYOPTION_UPDOWN && betType !== BET_TYPE.BINARYOPTION_UPDOWN_180S && betType !== BET_TYPE.BINARYOPTION_UPDOWN_90S) {
    // let _cacheLength = Object.keys(cachePriceHistoryData[_cachedPriceKey]).length;
    // let _latestKey = Object.keys(cachePriceHistoryData[_cachedPriceKey])[_cacheLength - 1];
    // if (cachePriceHistoryData[_cachedPriceKey][_latestKey] && cachePriceHistoryData[_cachedPriceKey][_latestKey].closePrice) {
    //   let fakeClosePrice = _generateFakeRandomPrice(cachePriceHistoryData[_cachedPriceKey][_latestKey].closePrice, closePrice);
    //   closePrice = fakeClosePrice;
    // }
  }

  cachePriceData[_cachedPriceKey].close = closePrice;

  if (cachePriceData[_cachedPriceKey].open === 0) {
    cachePriceData[_cachedPriceKey].open = closePrice;
  }

  if (closePrice && cachePriceData[_cachedPriceKey].high === 0) {
    cachePriceData[_cachedPriceKey].high = closePrice;
  } else if (closePrice && cachePriceData[_cachedPriceKey].high < closePrice) {
    cachePriceData[_cachedPriceKey].high = closePrice;
  }

  if (closePrice && cachePriceData[_cachedPriceKey].low === 0) {
    cachePriceData[_cachedPriceKey].low = closePrice;
  } else if (closePrice && cachePriceData[_cachedPriceKey].low > closePrice) {
    cachePriceData[_cachedPriceKey].low = closePrice;
  }
  cachePriceData[_cachedPriceKey].volume += tradeVolume;
}

function _makeCandleInSecondTimeFrame(cachedPriceKey, timeFrame = 15, endTime = moment().format(GAME_SECTION_TIME_DISPLAY_FORMAT)) {
  let _newCandle = {
    low: 0,
    high: 0,
    open: 0,
    close: 0,
    volume: 0,
  };

  let _cacheLength = Object.keys(cachePriceHistoryData[cachedPriceKey]).length;
  let _latestKey = Object.keys(cachePriceHistoryData[cachedPriceKey])[_cacheLength - 1];
  let _historyPriceDataByCryptoName = cachePriceHistoryData[`${cachedPriceKey}`];

  if (_historyPriceDataByCryptoName) {
    let _limitPriceIndex = Math.min(timeFrame, Object.values(_historyPriceDataByCryptoName).length);
    // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(`_limitPriceIndex ${_limitPriceIndex}`);
    //neu la giay dau tien thi lay gia cua giay truoc do
    if (_limitPriceIndex === 0 || isNaN(_limitPriceIndex)) {
      _limitPriceIndex = 1;
    }
    // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(`_limitPriceIndex ${_limitPriceIndex}`);
    // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(`_historyPriceDataByCryptoName`);
    // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(_historyPriceDataByCryptoName);
    let _priceArray = [];
    for (let i = 0; i <= timeFrame; i++) {
      let _priceRecordTime = moment(endTime, GAME_SECTION_TIME_DISPLAY_FORMAT)
        .add(timeFrame * -1 + i, 'second')
        .format(GAME_SECTION_TIME_DISPLAY_FORMAT);
      // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(`timeFrame ${timeFrame} _priceRecordTime ${_priceRecordTime}`);
      if (_historyPriceDataByCryptoName[_priceRecordTime] && _historyPriceDataByCryptoName[_priceRecordTime].closePrice) {
        _priceArray.push(_historyPriceDataByCryptoName[_priceRecordTime].closePrice);
      }
    }
    // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(`_priceArray ${_priceArray.length}`);
    // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(_priceArray);

    // let _previousPriceRecordTime;

    // for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    //   const _betType = Object.values(BET_TYPE)[i];
    //   if (cachedPriceKey.indexOf(_betType) >= 0) {
    //     _previousPriceRecordTime = getLastGameSection(GAME_ID.BINARYOPTION, _betType, GAME_RECORD_UNIT_BO.BTC);
    //     _previousPriceRecordTime = _previousPriceRecordTime.split('-')[0];
    //   }
    // }

    _newCandle.open = _priceArray[0];
    _newCandle.close = _priceArray[_priceArray.length - 1] * 1;
    _newCandle.low = Math.min(..._priceArray);

    if (!isFinite(_newCandle.low)) {
      _newCandle.low = _newCandle.close;
    }
    _newCandle.high = Math.max(..._priceArray);
    if (!isFinite(_newCandle.high)) {
      _newCandle.high = _newCandle.close;
    }

    // .add(_limitPriceIndex * -1, 'second').add(-1, 'second').format(GAME_SECTION_TIME_DISPLAY_FORMAT);
    // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(`_previousPriceRecordTime: ${_previousPriceRecordTime}`)
    // if (_historyPriceDataByCryptoName[_previousPriceRecordTime]) {
    //   if (_previousPriceRecordTime !== Object.keys(_historyPriceDataByCryptoName)[Object.keys(_historyPriceDataByCryptoName).length - 1]) {
    //     _newCandle.open = _historyPriceDataByCryptoName[_previousPriceRecordTime].closePrice;
    //   }
    // }

    let _historyVolumeDataByCryptoName = cacheVolumeHistoryData[`${cachedPriceKey}`];
    for (let i = 1; i <= _limitPriceIndex; i++) {
      let _volume = _historyVolumeDataByCryptoName[_historyVolumeDataByCryptoName.length - i];
      if (_volume) {
        _newCandle.volume += _volume;
      }
    }
  }
  // if (cachedPriceKey.indexOf(BET_TYPE.BINARYOPTION_UPDOWN_15S) >= 0) console.log(_newCandle);
  return _newCandle;
}
function fetchPriceData(cachedPriceKey, timeFrame, endTime) {
  let _candleStick = _makeCandleInSecondTimeFrame(cachedPriceKey, timeFrame, endTime);
  return _candleStick;
}

function refreshPriceDataByUnit(betType, unitName) {
  const _cachedPriceKey = `${betType}_${unitName}`;
  const _closePrice = cachePriceData[_cachedPriceKey].close;
  cachePriceData[_cachedPriceKey].high = 0;
  cachePriceData[_cachedPriceKey].open = 0;
  cachePriceData[_cachedPriceKey].low = 0;
  cachePriceData[_cachedPriceKey].volume = 0;
}

function refreshPriceData(betType, cryptoName) {
  const _cachedPriceKey = `${betType}_${GAME_RECORD_UNIT_BO[cryptoName]}`;
  const _closePrice = cachePriceData[_cachedPriceKey].close;
  cachePriceData[_cachedPriceKey].high = 0;
  cachePriceData[_cachedPriceKey].open = 0;
  cachePriceData[_cachedPriceKey].low = 0;
  cachePriceData[_cachedPriceKey].volume = 0;
}

let _randomPriceAdding = [];
function _refreshRandomPriceAdding() {
  _randomPriceAdding = [];
  for (let i = 0; i < 1000; i++) {
    _randomPriceAdding.push(0);
    _randomPriceAdding.push(1);
    _randomPriceAdding.push(1);
    _randomPriceAdding.push(0);
  }
  shuffleArrayRandom(_randomPriceAdding);
  shuffleArrayRandom(_randomPriceAdding);
  shuffleArrayRandom(_randomPriceAdding);
  shuffleArrayRandom(_randomPriceAdding);
}
//API > Giảm tỉ lệ ra nến HÒA (thêm biên độ random từ 0.005% - 0.01%)
function _generateFakeRandomPrice(oldPrice, newPrice, minRate = 0.01, maxRate = MAX_RATE) {
  const MULTIPLY = 1000000; //gia tang value de tang ti le random

  if (oldPrice) {
    let _incrementRate = randomIntByMinMax(minRate * MULTIPLY, maxRate * MULTIPLY);
    let _incrementValue = _incrementRate / MULTIPLY / 100;
    // if (oldPrice > newPrice) {
    //   _incrementValue = _incrementValue * newPrice;
    //   return newPrice - _incrementValue;
    // } else if (oldPrice < newPrice) {
    //   _incrementValue = _incrementValue * oldPrice;
    //   return oldPrice + _incrementValue;
    // } else {
    if (_randomPriceAdding.length < 10) {
      _refreshRandomPriceAdding();
    }
    let _randomAdding = _randomPriceAdding.pop();
    if (_randomAdding === 1) {
      _incrementValue = _incrementValue * newPrice;
      return newPrice + _incrementValue;
    } else {
      _incrementValue = _incrementValue * newPrice;
      return newPrice - _incrementValue;
    }
    // }
  } else {
    return newPrice;
  }
}

function _cacheBinanceData(betType, cryptoName, marketData) {
  const closePrice = marketData.k.c * 1;
  const openPrice = marketData.k.o * 1;
  const highPrice = marketData.k.h * 1;
  const lowPrice = marketData.k.l * 1;
  const tradeVolume = marketData.k.v * 1;

  _cacheData(betType, cryptoName, openPrice, closePrice, highPrice, lowPrice, tradeVolume);
  _cacheDataByUnit(cryptoName, openPrice, closePrice, highPrice, lowPrice, tradeVolume);
}

function _storeHistoryBinanceData(betType, cryptoName, marketData) {
  const _cachedPriceKey = `${betType}_${GAME_RECORD_UNIT_BO[cryptoName]}`;
  let closePrice = marketData.k.c * 1;
  const tradeVolume = marketData.k.v * 1;

  let _currentGameSection = getCurrentGameSection(GAME_ID.BINARYOPTION, betType, GAME_RECORD_UNIT_BO[cryptoName]);

  //bo sung random khi gia ko thay doi
  if (_randomPriceAdding.length < 10) {
    _refreshRandomPriceAdding();
  }

  var diffSecond = moment(GAME_SECTION_START_TIME, 'YYYYMMDD').startOf('year').diff(moment(), 'seconds') * -1;
  let diffSecondPerSection = getTimeDiffPerSectionByGame(betType);
  let passoverSecond = Math.floor(diffSecond % diffSecondPerSection);

  let _oldOpenPrice = Number(fetchPriceData(_cachedPriceKey, passoverSecond).open);
  if (betType === BET_TYPE.BINARYOPTION_UPDOWN_15S || betType === BET_TYPE.BINARYOPTION_UPDOWN_45S) {
    // if ((new Date() * 1) % 2 !== 0) {
    // const _oldPrice = Number(fetchPriceData(_cachedPriceKey, 1, moment().add(-1, 'second').format(GAME_SECTION_TIME_DISPLAY_FORMAT)).close);
    if (isNaN(_oldOpenPrice)) {
      _oldOpenPrice = closePrice;
    }
    closePrice = _generateFakeRandomPrice(_oldOpenPrice, closePrice);
    // }
  }

  //if (betType === BET_TYPE.BINARYOPTION_UPDOWN_15S) {
  //   _assignedResult = {
  //     gameRecordSection: _currentGameSection,
  //     gameRecordValue: BET_VALUE.BINARYOPTION.TANG,
  //   };
  //}

  let _previousAssignedResult;
  let _assignedResult;
  //Tại giây đầu tiên của kỳ hiện tại thì xử lý cần phải check lại theo kỳ trước đó
  if (passoverSecond === 0) {
    let previousGameSection = getLastGameSection(GAME_ID.BINARYOPTION, betType, GAME_RECORD_UNIT_BO[cryptoName]);
    _previousAssignedResult = getAssignedGameRecordFromCached(previousGameSection);
  }

  _assignedResult = getAssignedGameRecordFromCached(_currentGameSection);
  //Khi kỳ hiện tại không có kết quả dự đoán, mà kỳ trước đó có thì sẽ sử dụng kết quả dự đoán của kỳ trước đó
  //trường hợp này xảy ra ở giây đầu tiên (0s) của kỳ hiện tại
  if (!_assignedResult && _previousAssignedResult) {
    _assignedResult = _previousAssignedResult;
  }

  if (_assignedResult && isNotEmptyStringValue(_assignedResult.gameRecordSection)) {
    if (_assignedResult.gameRecordSection.indexOf(betType) >= 0) {
      let _lastGameRecordValue = _assignedResult.lastGameRecordValue;

      if (_lastGameRecordValue) {
        const close = parseFloat(_lastGameRecordValue.split(';')[4]) * 1;

        if (_assignedResult.gameRecordResult === BET_VALUE.BINARYOPTION.TANG) {
          closePrice = randomFloatByMinMax(close, close + (close * MAX_RATE) / 100);
        } else if (_assignedResult.gameRecordResult === BET_VALUE.BINARYOPTION.GIAM) {
          closePrice = randomFloatByMinMax(close, close - (close * MAX_RATE) / 100);
        } else if (_assignedResult.gameRecordResult === BET_VALUE.BINARYOPTION.HOA) {
          closePrice = close;
        }
      }
    }
  }
  _storeHistoryPrice(_cachedPriceKey, closePrice, diffSecondPerSection * 10);
  _storeHistoryVolume(_cachedPriceKey, tradeVolume, diffSecondPerSection * 10);
}

function _cacheTradingViewData(betType, cryptoName, marketData) {
  const openPrice = marketData.open_price * 1;
  const closePrice = marketData.lp * 1;
  const highPrice = marketData.high_price * 1;
  const lowPrice = marketData.low_price * 1;
  const tradeVolume = 0; //marketData.volume * 1;
  _cacheData(betType, cryptoName, 0, closePrice, 0, 0, 0);
}

const storeTradeData = {
  message: async data => {
    let _cryptoData = JSON.parse(data);
    if (_cryptoData) {
      let cryptoCurrency = _cryptoData.s;
      if (cryptoCurrency) {
        const cryptoName = cryptoCurrency.replace('USDT', '');
        if (cryptoName === '') {
          return;
        }
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN, cryptoName, _cryptoData);
        // _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_5S, cryptoName, _cryptoData);
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_15S, cryptoName, _cryptoData);
        // _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_30S, cryptoName, _cryptoData);
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_45S, cryptoName, _cryptoData);
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_60S, cryptoName, _cryptoData);
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_90S, cryptoName, _cryptoData);
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_180S, cryptoName, _cryptoData);

        _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN, cryptoName, _cryptoData);
        // _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_5S, cryptoName, _cryptoData);
        _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_15S, cryptoName, _cryptoData);
        // _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_30S, cryptoName, _cryptoData);
        _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_45S, cryptoName, _cryptoData);
        _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_60S, cryptoName, _cryptoData);
        _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_90S, cryptoName, _cryptoData);
        _storeHistoryBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_180S, cryptoName, _cryptoData);
      }
    }
  },
};
const storeTradeData1m = {
  message: async data => {
    let _cryptoData = JSON.parse(data);
    if (_cryptoData) {
      let cryptoCurrency = _cryptoData.s;
      if (cryptoCurrency) {
        const cryptoName = cryptoCurrency.replace('USDT', '');
        if (cryptoName === '') {
          return;
        }
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN, cryptoName, _cryptoData);
      }
    }
  },
};

const storeTradeData3m = {
  message: async data => {
    let _cryptoData = JSON.parse(data);
    if (_cryptoData) {
      let cryptoCurrency = _cryptoData.s;
      if (cryptoCurrency) {
        const cryptoName = cryptoCurrency.replace('USDT', '');
        if (cryptoName === '') {
          return;
        }
        _cacheBinanceData(BET_TYPE.BINARYOPTION_UPDOWN_180S, cryptoName, _cryptoData);
      }
    }
  },
};

function storeTradingViewData(symbol, priceData) {
  let cryptoName = symbol.replace('USD', '');

  _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN, cryptoName, priceData);
  // _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN_5S, cryptoName, priceData);
  _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN_15S, cryptoName, priceData);
  // _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN_30S, cryptoName, priceData);
  _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN_45S, cryptoName, priceData);
  _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN_60S, cryptoName, priceData);
  _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN_90S, cryptoName, _cryptoData);
  _cacheTradingViewData(BET_TYPE.BINARYOPTION_UPDOWN_180S, cryptoName, _cryptoData);
}

module.exports = {
  refreshPriceData,
  refreshPriceDataByUnit,
  fetchPriceData,
  storeTradeData,
  storeTradeData3m,
  storeTradeData1m,
  storeTradingViewData,
};
