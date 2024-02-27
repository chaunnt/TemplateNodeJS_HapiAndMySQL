/* Copyright (c) 2023 TORITECH LIMITED 2022 */

require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const LogZNSResourceAccess = require('../../../API/ZNSApi/resourceAccess/LogZNSResourceAccess');

async function _getOAAccessToken() {
  return await chai
    .request(`https://${process.env.ZALO_OA_HOST_URL}`)
    .get('/ZaloAPI/robot/getOAAccessToken')
    .set('authorization', process.env.GET_ZALO_ACCESS_TOKEN_API_KEY)
    .then(res => {
      if (res.status === 200) {
        return res.text;
      } else {
        return undefined;
      }
    })
    .catch(e => {
      console.error('get OA access token error:', e);
      return undefined;
    });
}

/**
 *
 * @param {string} phoneNumber phone number
 * @param {object} data message data theo template_id
 * @param {string} trackingId tracking id theo db cua TTDK
 */
async function sendZNSMessageToUserByZaloAPI(phoneNumber, templateId, data, trackingId) {
  // if (process.env.ZNS_ENABLE * 1 !== 1) {
  //   return;
  // }
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '84' + phoneNumber.slice(1);
  }
  const accessToken = await _getOAAccessToken();

  if (!accessToken) {
    return;
  }
  const payload = {
    phone: phoneNumber,
    template_id: templateId,
    template_data: data,
    tracking_id: trackingId,
  };
  // if (process.env.ZNS_MODE === 'development') {
  //   payload.mode = 'development';
  // }
  return new Promise((resolve, reject) => {
    chai
      .request('https://business.openapi.zalo.me')
      .post('/message/template')
      .set('access_token', accessToken)
      .send(payload)
      .then(async res => {
        //  lưu log toàn bộ message gửi qua ZNS Zalo API
        await LogZNSResourceAccess.insert({
          phoneNumber: phoneNumber,
          templateId: templateId,
          data: JSON.stringify(data),
          trackingId: trackingId,
          accessTokenOA: accessToken,
          responseResult: JSON.stringify(res.body),
        });

        if (res.body && res.body.error === 0) {
          resolve(res.body);
        } else if (res.body && res.body.error !== 0) {
          resolve(res.body);
        } else {
          resolve(res.body);
        }
      })
      .catch(e => {
        console.error('sendZNSMessageToUserByZaloAPI error:', e);
        resolve(undefined);
      });
  });
}

module.exports = {
  sendZNSMessageToUserByZaloAPI,
};
