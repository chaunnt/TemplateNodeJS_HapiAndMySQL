/* Copyright (c) 2021-2023 Reminano */
require('dotenv').config();
const Logger = require('../../utils/logging');
const mqtt = require('mqtt');
const moment = require('moment');

if (process.env.MQTT_BROKER_ENABLE * 1 === 1) {
  return;
}

////MQTT Client
Logger.info(`MQTT Connect` + `mqtt://${process.env.MQTT_BROKER_HOST}:${process.env.MQTT_BROKER_PORT}`);
let _agentList = [];
console.log(2);
addClient();

let client = getClient();
function addClient() {
  let _client = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_HOST}:${process.env.MQTT_BROKER_PORT}`, {
    clientId: `OKEDA_GAME${new Date()}`,
  });
  _agentList.push(_client);
}
function getClient() {
  return _agentList[0];
}

initializeClient();

async function initializeClient() {
  let _client = getClient();
  if (_client) {
    _client = _agentList.pop();
    if (_client.connected) {
      await _client.endAsync(true);
      _client.removeAllListeners();
      _client.removeOutgoingMessage();
      delete _client;
    }
  }

  addClient();
  client = getClient();

  client.on('connect', function () {
    Logger.info('MQTT Client connected');
    client.subscribe('SERVER_TIME', function (err) {
      Logger.info('MQTT Client Subcribed success');
    });
    client.subscribe('OKEDA_CLIENT', function (err) {
      Logger.info('MQTT Client Subcribed success');
    });
  });

  client.on('message', function (topic, message) {
    Logger.info(`message on ${topic}`);
  });
  client.on('reconnect', function () {
    Logger.info(`MQTT Client reconnect at ${new Date()}`);
  });
  client.on('close', function () {
    Logger.info(`MQTT Client close at ${new Date()}`);
  });
  client.on('disconnect', function () {
    // initializeClient();
    Logger.info(`MQTT Client disconnect at ${new Date()}`);
  });
  client.on('offline', function () {
    Logger.info(`MQTT Client offline at ${new Date()}`);
  });
  // client.on('packetreceive', function (package) {
  //   Logger.info(`MQTT Client packetreceive at ${new Date()}`);
  // });
  client.on('packetsend', function (package) {
    Logger.info(`MQTT Client packetsend at ${new Date()}`);
  });
  client.on('error', function (error) {
    Logger.info(`MQTT Client error at ${new Date()}`);
    Logger.error(error);
  });
}

setInterval(() => {
  initializeClient();
}, 17000);

////WS Client
// var client  = mqtt.connect('ws://vtss-station-server.makefamousapp.com:10777', {
//   wsOptions: {
//     host: "vtss-station-server.makefamousapp.com",
//     port: 10777
//   }
// })

//WSS Client
// var client  = mqtt.connect('wss://vtss-station-server.makefamousapp.com:10666', {
//   rejectUnauthorized: false
// })

setInterval(() => {
  publishMessageToClient('OKEDA_CLIENT', 'OKEDA_CLIENT');
}, 5000);

setInterval(() => {
  // Logger.info(moment().format(`YYYYMMDDHHmmss _CCUCounter: ${_CCUCounter}`));
  publishMessageToClient('SERVER_TIME', moment().add(-1, 'second').format('YYYYMMDDHHmmss'));
}, 1000);

function publishMessageToClient(topic, message) {
  try {
    let _client = getClient();
    if (_client && _client.connected) {
      _client.publish(topic, message, {
        qos: 0,
        retain: false,
      });
      _client.removeOutgoingMessage();
    }
  } catch (error) {
    Logger.error(error);
    Logger.error(`publishJSONToClient ${topic}`);
  }
}
function publishJSONToClient(topic, data) {
  Logger.info(`publishJSONToClient ${topic}`);
  try {
    let _client = getClient();
    if (_client && _client.connected) {
      _client.publish(topic, JSON.stringify(data), {
        qos: 0,
        retain: false,
      });
      _client.removeOutgoingMessage();
    }
  } catch (error) {
    Logger.error(error);
    Logger.error(`publishJSONToClient ${topic}`);
  }
}
module.exports = {
  publishMessageToClient,
  publishJSONToClient,
};
