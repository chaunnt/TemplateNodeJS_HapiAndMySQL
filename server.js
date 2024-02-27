/* Copyright (c) 2020-2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';
require('dotenv').config();
const Logger = require('./utils/logging');
const Glue = require('glue');
const Routes = require('./config/routes');
const Manifest = require('./config/manifest');
const AppConfig = require('./config/app');
const CronJob = require('./cron/index');
const { reportToTelegram } = require('./ThirdParty/TelegramBot/TelegramBotFunctions');
require('./ThirdParty/BOTradingBinanceWS/klineWS'); //websocket
//tam thoi khong can su dung trading view
// require('./ThirdParty/TradingViewWS/TradingViewClient');
// const MQTTClient = require('./ThirdParty/MQTTClient/MQTTClient');
// const { createCheckoutPayment } = require('./ThirdParty/SunpayGateway/SunpayGatewayFunction');

if (process.env.MQTT_BROKER_ENABLE * 1 === 1) {
  // const MQTTBroker = require('./ThirdParty/MQTTBroker/MQTTBroker');
}
if (process.env.SOCKETIO_ENABLE * 1 === 1) {
  const SocketIO = require('./ThirdParty/SocketIO/SocketIO');
  const SocketIOClient = require('./ThirdParty/SocketIO/SocketIOClient');
}

Glue.compose(Manifest, { relativeTo: __dirname }, (err, server) => {
  if (err) {
    throw err;
  }

  server.start(() => {
    Logger.info('Server running at:', server.info.uri);
    Logger.info('Server time: ' + new Date());
    reportToTelegram(`Khởi động máy chủ: ${new Date()}`);
    // createCheckoutPayment(5, 1000000);
    if (process.env.NODE_ENV && process.env.NODE_ENV !== 'dev') {
      if (process.env.WORKER_ENABLE && process.env.WORKER_ENABLE * 1 === 1) {
        CronJob.startSchedule();
      }
    }
  });
  server.auth.strategy('jwt', 'jwt', {
    key: AppConfig.jwt.secret,
    verifyOptions: { algorithms: ['HS256'] },
  });
  server.route(Routes);
});
