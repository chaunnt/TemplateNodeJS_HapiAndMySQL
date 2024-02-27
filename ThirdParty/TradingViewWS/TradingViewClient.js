/* Copyright (c) 2023 Reminano */

const { TradingViewAPI } = require('tradingview-scraper');
const { storeTradingViewData } = require('../../API/GameRecord/cronjob/binaryoption/BOTradingBinance');

const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'BNBUSD', 'DOGEUSD', 'XRPUSD', 'SHIBUSD', 'PEPEUSD', 'FLOKI'];
const tv = new TradingViewAPI();
const Logger = require('../../utils/logging');

function callbackData(symbol, priceData) {
  storeTradingViewData(symbol, priceData);
}

async function runClient() {
  try {
    tv.setup().then(() => {
      for (let i = 0; i < cryptoSymbols.length; i++) {
        try {
          tv.getTicker(cryptoSymbols[i]).then(ticker => {
            Logger.info(`TradingViewClient ticker ${cryptoSymbols[i]}`);
            ticker.on('update', data => {
              if (data.lp) {
                callbackData(cryptoSymbols[i], data);
              }
            });
          });
        } catch (error) {
          Logger.error(`getTicker error`);
        }
      }
    });
  } catch (error) {
    Logger.error(`TradingViewClient run error`);
    Logger.error(error);
  }
}

runClient();
