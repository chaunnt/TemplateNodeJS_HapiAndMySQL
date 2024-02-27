/* Copyright (c) 2021-2023 Reminano */

require('dotenv').config();

const MQTT_ADMIN_USERNAME = process.env.MQTT_ADMIN_USERNAME || 'mqttadmin';
const MQTT_ADMIN_PASSWORD = process.env.MQTT_ADMIN_PASSWORD || 'mqttadminpass';

const MQTT_PORT = parseInt(process.env.MQTT_PORT || 5555);
const WEBSOCKET_SSL_PORT = parseInt(process.env.WEBSOCKET_SSL_PORT || 6666);
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || 7777);
const Logger = require('../../utils/logging');

const ws = require('websocket-stream');
const fs = require('fs');
const aedes = require('aedes')({
  queueLimit: 20000,
  concurrency: 5000,
});
// const aedes = require('aedes')({
//   authenticate: (client, username, password, callback) => {

//   },
//   authorizePublish: (client, packet, callback) => {

//   },

//   authorizeSubscribe: (client, packet, callback) => {

//   }
// });

//MQTT Broker
const mqttBroker = require('net').createServer(aedes.handle);
mqttBroker.listen(MQTT_PORT, function () {
  Logger.info('mqtt broker started and listening on port ', MQTT_PORT);
});

//Websocket 'WS'
const httpServer = require('http').createServer();
ws.createServer({ server: httpServer }, aedes.handle);
httpServer.listen(WEBSOCKET_PORT, function () {
  Logger.info('Aedes MQTT-WS listening on port: ' + WEBSOCKET_PORT);
});

//Websocket SSL 'WSS'
const httpsServer = require('https').createServer({
  key: fs.readFileSync(`${process.env.KEY_PATH}openssl/privkey.pem`),
  cert: fs.readFileSync(`${process.env.KEY_PATH}openssl/fullchain.pem`),
});
ws.createServer({ server: httpsServer }, aedes.handle);
httpsServer.listen(WEBSOCKET_SSL_PORT, function () {
  Logger.info('Aedes MQTT-WSS listening on port: ' + WEBSOCKET_SSL_PORT);
});

let _CCUCounter = 0;
aedes.on('clientReady', function (client) {
  Logger.info('[MQTT] client connected ' + client.id);
  _CCUCounter++;
});
aedes.on('clientDisconnect', function (client) {
  Logger.info('[MQTT] client disconnected ' + client.id);
  _CCUCounter--;
});
aedes.on('subscribe', function (subscriptions, client) {
  Logger.info('[MQTT] client subscribe ' + client.id);
  Logger.info('[MQTT] client subscribe ' + JSON.stringify(subscriptions));
});

// fired when a message is received
// aedes.on('published', function (packet, client) {
//   Logger.info(`[MQTT] published ${JSON.stringify(packet)}`);
// });

// server.on('ready', () => {
//   Logger.info('✓'.green + ' Mqtt server is running on port: '.cyan + `${MQTT_PORT}`.green);
//   Logger.info('✓'.green + ' Mqtt over websocket is on port: '.cyan + `${MQTT_WS_PORT}`.green);

//   server.authenticate = (client, username, password, callback) => {
//     Logger.info(username, password);
//     var authorized = username === MQTT_ADMIN_USERNAME && password.toString() === MQTT_ADMIN_PASSWORD;
//     if (authorized) client.user = username;
//     callback(null, authorized);
//   };

//   const message = {
//     topic: 'SERVER',
//     payload: `Mqtt Server over websocket started at ${new Date()}`,
//     qos: 2,
//     retain: true,
//   };
//   publish(message);
// });

// const _publish = message =>
//   new Promise((resolve, reject) => {
//     message = Object.assign({ qos: 0, retain: false }, message);
//     // Logger.info(JSON.stringify(message));
//     aedes.publish(message, (obj, packet) => {
//       return resolve(message.topic);
//     });
//   });

function _publish(message) {
  aedes.publish(message, error => {
    if (error) {
      Logger.error(`aedes.publish error`);
      Logger.error(error);
      Logger.error(message);
    }
  });
}

function publishJson(topic, json) {
  Logger.info(`publishJson ${topic}`);
  const payload = Object.assign({ _id: new Date().toISOString() }, json);
  const message = {
    topic,
    payload: JSON.stringify(payload),
    qos: 0,
    retain: false,
  };
  return _publish(message);
}

function publishMessage(topic, message) {
  const packetData = {
    topic,
    payload: message,
    qos: 0,
    retain: false,
  };
  return _publish(packetData);
}

const moment = require('moment');
setInterval(() => {
  Logger.info(moment().format(`YYYYMMDDHHmmss _CCUCounter: ${_CCUCounter}`));
  // publishMessage('SERVER_TIME', moment().add(-1, 'second').format('YYYYMMDDHHmmss'));
}, 1000);

module.exports = {
  publishMessage,
  publishJson,
};
