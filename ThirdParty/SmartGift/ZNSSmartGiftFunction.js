/* Copyright (c) 2023 TORITECH LIMITED 2022 */

require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const API_MESSAGE_URI = 'https://cluster1-api.zalozns.net';
const API_AUTH_URI = 'https://cluster1-auth.zalozns.net';

let _smartGiftToken = undefined;

async function getSmartGiftTokenFromAPIServices() {
  const tokenAPIUrl = process.env.SMARTGIFT_TOKEN_API_URL || `http://localhost:${process.env.PORT}`;

  return new Promise((resolve, reject) => {
    chai
      .request(tokenAPIUrl)
      .get(`/SmartGiftApi/getAccessToken?apikey=${process.env.SYSTEM_API_KEY}`)
      .then(res => {
        if (res.body && res.body.statusCode === 200) {
          resolve(res.body.data);
        } else {
          resolve(undefined);
        }
      })
      .catch(e => {
        console.error('getSmartGiftTokenFromAPIServices token error:', e);
        resolve(undefined);
      });
  });
}

function getSmartGiftToken() {
  if (_smartGiftToken) {
    return _smartGiftToken;
  }
  return '';
}

async function _loginSmartGiftAccount(customConfig) {
  const username = process.env.SMARTGIFT_USERNAME || 'SMARTGIFT_USERNAME';
  const password = process.env.SMARTGIFT_PASSWORD || 'SMARTGIFT_PASSWORD';
  const media_code = process.env.SMARTGIFT_MEDIA_CODE || 'ttdk';

  let body = {
    username: username,
    password: password,
    media_code: media_code,
  };
  if (customConfig) {
    body = {
      username: customConfig.username,
      password: customConfig.password,
      media_code: customConfig.media_code,
    };
  }

  return new Promise((resolve, reject) => {
    chai
      .request(API_AUTH_URI)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send(body)
      .then(res => {
        if (res.body.status === 200) {
          resolve(res.body.data);
        } else {
          resolve(undefined);
        }
      })
      .catch(e => {
        console.error('get OA access token error:', e);
        resolve(undefined);
      });
  });
}

async function initClient() {
  let _smartGiftData = await _loginSmartGiftAccount();

  if (_smartGiftData) {
    _smartGiftToken = _smartGiftData.token;
  } else {
    console.error(`FAILED !!! initClient _smartGiftToken`);
  }
}

async function sendZNSMessageFromSmartGift(messageZNSTemplateId, phoneNumber, params, customConfig) {
  let _accessToken = await getSmartGiftTokenFromAPIServices();
  //senderCode mặc định của TTDK mà bên SmartGift cấp
  let senderCode = 'TTDK01';

  if (customConfig) {
    _accessToken = await _loginSmartGiftAccount(customConfig);
    _accessToken = _accessToken.token;

    //Nếu là của đối tác khác thì phải thay đổi theo customConfig của đối tác
    senderCode = customConfig.senderCode;
  }

  const token = `Bearer ${_accessToken}`;

  let body = {
    send_modes: [2],
    template_codes: [`${messageZNSTemplateId}`],
    sender_codes: [senderCode], // TTDK01
    message: {
      phone: phoneNumber,
      params: [
        params, // Obj
      ],
      tracking: 'test',
    },
  };

  return new Promise((resolve, reject) => {
    chai
      .request(API_MESSAGE_URI)
      .post('/webhook/send')
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .send(body)
      .then(res => {
        if (res.body.status === 200) {
          resolve(res.body.data);
        } else if (res.body.status !== 200) {
          console.info(`FAILED !! sendZNSMessageFromSmartGift`);
          console.info(res.text);
          resolve(res.body.data);
        } else {
          console.info(`FAILED !! sendZNSMessageFromSmartGift`);
          console.info(res.text);
          resolve(undefined);
        }
      })
      .catch(e => {
        console.error('ERROR !! sendZNSMessageFromSmartGift');
        console.error(e);
        resolve(undefined);
      });
  });
}

async function sendSmartGiftTestZNSMessage(phoneNumber) {
  let params = {
    customerRecordPlatenumber: '59C12589',
    customerRecordCheckExpiredDate: '01/01/2024',
    stationsName: 'TTDK Tan Binh 1011S',
    stationsAddress: 'P15 Q Tan Binh TP.HCM',
    stationCode: '5099D',
  };
  return sendZNSMessageFromSmartGift(262211, `${phoneNumber}`, params);
}

module.exports = {
  initClient,
  getSmartGiftToken,
  getSmartGiftTokenFromAPIServices,
  sendSmartGiftTestZNSMessage,
  sendZNSMessageFromSmartGift,
};
