/* Copyright (c) 2021-2024 Reminano */

require('dotenv').config();

const WEBSOCKET_SSL_PORT = parseInt(process.env.WEBSOCKET_SSL_PORT || 6666);
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || 7777);
const Logger = require('../../utils/logging');

const { io } = require('socket.io-client');
const KEY_SOCKET_IO = process.env.KEY_SOCKET_IO || 'SOCKET_IO_KEY';

let socket;
if (process.env.SOCKETIO_ENABLE * 1 === 1) {
  if (process.env.RUNNING_LOCAL * 1 === 1) {
    // đối tượng socket server local
    socket = io('http://localhost:7777');
  } else {
    // đối tượng socket server
    socket = io(`wss://${process.env.SOCKET_IO_HOST}:${process.env.WEBSOCKET_SSL_PORT_CLIENT}`);
    //  socket = io(`https://socket.bovipvn.com:25668`);
  }
  socket.on('client', socketId => {
    Logger.info(socketId);
  });
}

function publishJSONToClient(topic, data) {
  if (process.env.SOCKETIO_ENABLE * 1 === 1) {
    Logger.info(`publishJSONToClient ${topic}`);
    let result = {};
    result.topic = topic;
    result.data = data;
    socket.emit(KEY_SOCKET_IO, JSON.stringify(result));
  }
}

const moment = require('moment');
setInterval(() => {
  publishJSONToClient('SERVER_TIME', moment().add(-1, 'second').format('YYYYMMDDHHmmss'));
}, 1000);
module.exports = {
  publishJSONToClient,
};
