/* Copyright (c) 2023-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const { Console } = require('console');
const Spot = require('../../ThirdParty/BOTradingBinanceWS/spot');
const logger = new Console({ stdout: process.stdout, stderr: process.stderr });
const client = new Spot('', '', { logger });
const { storeTradeData, storeTradeData1m, storeTradeData3m } = require('../../API/GameRecord/cronjob/binaryoption/BOTradingBinance');

const cryptoSymbols = [
  'BTCUSDT',
  // , 'ETHUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT', 'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT'
];
for (let i = 0; i < cryptoSymbols.length; i++) {
  client.klineWS(cryptoSymbols[i].toLowerCase(), '1s', storeTradeData); //BTC
  client.klineWS(cryptoSymbols[i].toLowerCase(), '1m', storeTradeData1m); //BTC
  client.klineWS(cryptoSymbols[i].toLowerCase(), '3m', storeTradeData3m); //BTC
}
