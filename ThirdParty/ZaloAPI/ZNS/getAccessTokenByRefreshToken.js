/* Copyright (c) 2023 TORITECH LIMITED 2022 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chai = require('chai');
const moment = require('moment');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const { reportToTelegram } = require('../../TelegramBot/TelegramBotFunctions');

function getOAAccessTokenFilePath() {
  const _tokenFilePath = path.resolve(__dirname, `../../../configFiles/ZaloZNS/accessToken`);
  return _tokenFilePath;
}
function _getRefreshTokenFilePath() {
  const _tokenFilePath = path.resolve(__dirname, `../../../configFiles/ZaloZNS/refreshTokenv1`);
  return _tokenFilePath;
}

async function getAccessTokenByRefreshToken() {
  let _refreshToken =
    'cFm_6ugAC5cQzZ0KY8KnKvhnCHAJqt06Xg8EATNLUs-RoN9tqTrcCxYeSZNnkIajkOXTQEsR34cVbs8AuePe49UpPo7qlGzjWxzmRDo-4NEwaN5Iyx5bHel3RNcRjc19rOKsUuI4UK7QYYjSb8jRIFkML5oOj2vBvQLcLOsqCLZfWceSYvKc3vlYMY3RxrSMiTWS1VNnJZIuWXaUoFvwBeRDTIdYlGugehXcCCwxQZ25e1i_nODRVzIBL4UxdmDTqBa8MgUeScFul0bzXQvTE92p5W7Pasayq-8X6zcKJpwBk1Spugr68F6nHmU4b4a0o-S7EeRL3WhgrreMc_1G4_c571UeW4WM-P448ApuJZUzZKztwwi7PgFV2dNfyNjodemLNkwl6rgWZ6eQJIT4ENMBbZTP';
  let _refreshTokenFilePath = _getRefreshTokenFilePath();
  let _OAAccessTokenFilePath = getOAAccessTokenFilePath();
  if (fs.existsSync(_refreshTokenFilePath)) {
    _refreshToken = fs.readFileSync(_refreshTokenFilePath, { encoding: 'utf-8' });
  }

  // Define request body params
  const requestBody = {
    refresh_token: _refreshToken,
    app_id: process.env.ZMP_APP_ID,
    grant_type: 'refresh_token',
  };

  // Define request headers
  const requestHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    secret_key: process.env.ZMP_SECRET,
  };

  // Send the POST request with chai-http
  chai
    .request('https://oauth.zaloapp.com')
    .post('/v4/oa/access_token')
    .send(requestBody)
    .set(requestHeaders)
    .then(res => {
      if (res.status === 200 && res.text.includes('access_token')) {
        const data = JSON.parse(res.text);
        console.info('data: ', data);
        reportToTelegram(`OA token at ${new Date().toISOString()}: ${JSON.stringify(data)}`);
        fs.writeFileSync(_OAAccessTokenFilePath, data.access_token, {
          encoding: 'utf-8',
        });
        fs.writeFileSync(_refreshTokenFilePath, data.refresh_token, { encoding: 'utf-8' });
      } else {
        reportToTelegram(`getAccessTokenByRefreshToken_failed_${JSON.stringify(res)}`);
      }
    })
    .catch(e => {
      reportToTelegram(`getAccessTokenByRefreshToken_catch_${JSON.stringify(e)}`);
    });
}

module.exports = {
  getAccessTokenByRefreshToken,
  getOAAccessTokenFilePath,
};
