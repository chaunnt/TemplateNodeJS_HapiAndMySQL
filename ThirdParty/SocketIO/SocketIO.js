/* Copyright (c) 2021-2023 Reminano */

require('dotenv').config();

const WEBSOCKET_SSL_PORT = parseInt(process.env.WEBSOCKET_SSL_PORT || 6666);
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || 7777);
const Logger = require('../../utils/logging');

const fs = require('fs');
const { Server } = require('socket.io');
const KEY_SOCKET_IO = process.env.KEY_SOCKET_IO || 'SOCKET_IO_KEY';

if (process.env.SOCKETIO_ENABLE * 1 === 1) {
  if (process.env.RUNNING_LOCAL * 1 === 1) {
    const httpServer = require('http').createServer();
    httpServer.listen(WEBSOCKET_PORT, function () {
      Logger.info('Aedes SOCKET-IO-WS listening on port: ' + WEBSOCKET_PORT);
    });
    const io = new Server(httpServer, { cors: { origin: '*' } });
    io.on('connection', socket => {
      io.emit('client', socket.id);

      socket.on(KEY_SOCKET_IO, data => {
        data = JSON.parse(data);
        io.emit(data.topic, data);
      });

      socket.on('disconnect', reason => {
        io.emit('key', socket.id);
      });
    });
  } else {
    const httpsServer = require('https').createServer({
      key: fs.readFileSync(`${process.env.KEY_PATH}openssl/privkey.pem`),
      cert: fs.readFileSync(`${process.env.KEY_PATH}openssl/fullchain.pem`),
    });
    httpsServer.listen(WEBSOCKET_SSL_PORT, function () {
      Logger.info('Aedes SOCKET-IO-WSS listening on port: ' + WEBSOCKET_SSL_PORT);
    });
    const io = new Server(httpsServer, { cors: { origin: '*' } });

    io.on('connection', socket => {
      io.emit('client', socket.id);

      socket.on(KEY_SOCKET_IO, data => {
        data = JSON.parse(data);
        io.emit(data.topic, data);
      });

      socket.on('disconnect', reason => {
        io.emit('key', socket.id);
      });
    });
  }
}

module.exports = {};
