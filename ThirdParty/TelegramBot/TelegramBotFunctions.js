/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
let tokenConfig = process.env.TELEGRAM_BOT_DEPOSIT_TOKEN || '601021231233:lajsdlahefnlasdkjaosdasldk';
let botConfig = new TelegramBot(tokenConfig, { polling: false });

let chatIdConfig = process.env.TELEGRAM_CHAT_ID_DEPOSIT_NOTIFICATION || '@xxxbot';

const token = process.env.TELEGRAM_BOT_TOKEN || '12309434081:lajsdalskdjalsdasd';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: false });
const chatId = process.env.TELEGRAM_CHAT_ID || '@ManLiveNotify';

let _messageQueue = [];
let _messageQueueConfig = [];
setInterval(() => {
  if (_messageQueue.length > 0) {
    let _sendingMessages = '';
    for (let i = 0; i < 20; i++) {
      let message = _messageQueue.pop();
      if (message) {
        _sendingMessages += `\r\n ${process.env.PROJECT_NAME} >> ${message}`;
      }
    }

    try {
      bot.sendMessage(chatId, `${_sendingMessages}`);
    } catch (error) {}
  }
  if (_messageQueueConfig.length > 0) {
    let _sendingMessages = '';
    for (let i = 0; i < 20; i++) {
      let message = _messageQueueConfig.pop();
      if (message) {
        _sendingMessages += `\r\n ${process.env.PROJECT_NAME} >> ${message}`;
      }
    }
    try {
      botConfig.sendMessage(chatIdConfig, `${_sendingMessages}`);
    } catch (error) {}
  }
}, 1000);

function reportToTelegram(message) {
  if (_messageQueue.indexOf(message) >= 0) {
    return 1; //skip
  }
  _messageQueue.push(message);
}

function reportToTelegramByConfig(message, token, chatId) {
  if (_messageQueueConfig.indexOf(message) >= 0) {
    return 1; //skip
  }
  if (token) {
    tokenConfig = token;
  }
  if (chatId) {
    chatIdConfig = chatId;
  }
  _messageQueueConfig.push(message);
}
module.exports = {
  reportToTelegram,
  reportToTelegramByConfig,
};
