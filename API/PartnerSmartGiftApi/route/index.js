/* Copyright (c) 2023 TORITECH LIMITED 2022 */

require('dotenv').config();

const SmartGiftApi = require('./SmartGiftApiRoute');

module.exports = [
  { method: 'GET', path: '/SmartGiftApi/getAccessToken', config: SmartGiftApi.getSmartGiftAccessToken },
  //TODO LATER
  // { method: 'POST', path: '/SmartGiftApi/sendTestZNSMessage', config: SmartGiftApi.sendSmartGiftTestZNSMessage },
];
