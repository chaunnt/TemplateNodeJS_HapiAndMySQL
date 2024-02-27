/* Copyright (c) 2023 TORITECH LIMITED 2022 */

require('dotenv').config();
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const { getOAAccessTokenFilePath } = require('../../../ThirdParty/ZaloAPI/ZNS/getAccessTokenByRefreshToken');
const fs = require('fs');
const path = require('path');

module.exports = [
  // API for client get zalo user accessToken to deploying to Zalo mini app
  {
    method: 'GET',
    path: '/getZaloAccessToken',
    handler: function (request, reply) {
      if (process.env.ZALO_AUTHENTICATION_ENABLE * 1 !== 1) {
        reportToTelegram(`trying to get zalo user accessToken >>>> ${JSON.stringify(request.headers)}`);
        return reply.redirect(`https://google.com`);
      }
      if (!request.headers.authorization || request.headers.authorization !== process.env.GET_ZALO_ACCESS_TOKEN_API_KEY) {
        reportToTelegram(`trying to get zalo user accessToken >>>> ${JSON.stringify(request.headers)}`);
        return reply.redirect(`https://google.com`);
      } else {
        const accessToken = fs.readFileSync(path.resolve(__dirname, '../../../ThirdParty/ZaloAPI/ZNS/accessToken'), { encoding: 'utf-8' });
        return reply(accessToken).code(200);
      }
    },
  },
  {
    // API for client get Zalo OA AccessToken
    method: 'GET',
    path: '/ZaloAPI/robot/getOAAccessToken',
    handler: function (request, reply) {
      if (process.env.ZALO_AUTO_REFRESH_TOKEN_ENABLE * 1 !== 1) {
        reportToTelegram(`trying to get OA accessToken >>>> ${JSON.stringify(request.headers)}`);
        return reply.redirect(`https://google.com`);
      }
      const accessToken = fs.readFileSync(getOAAccessTokenFilePath(), { encoding: 'utf8' });
      return reply(accessToken).code(200);
    },
  },
];
