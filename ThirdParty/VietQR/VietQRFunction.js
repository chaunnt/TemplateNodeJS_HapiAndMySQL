/* Copyright (c) 2024 Reminano */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const { isNotEmptyStringValue } = require('../../API/ApiUtils/utilFunctions');
chai.use(chaiHttp);
const Logger = require('../../utils/logging');
const VIETQR_API_DEMO_KEY = '1c70861c-c68a-4b72-a93d-0912380asd012';
const VIETQR_CLIENT_DEMO_ID = 'c6f644ae-3f98-4e3c-8719-0-1239asdl';
// crawlBankAccount("00061131934","970423");
async function crawlBankAccount(accountNo, acqId) {
  console.log(`crawlBankAccount`);
  let dataParam = {
    accountNumber: accountNo, // số TK người nhận
    bin: acqId * 1, // code ngân hàng
  };
  return await new Promise(async (resolve, reject) => {
    await chai
      .request('https://api.vietqr.io')
      .post(`/v2/lookup`)
      .set('x-client-id', VIETQR_CLIENT_DEMO_ID)
      .set('x-api-key', VIETQR_API_DEMO_KEY)
      // .set('authority: api.vietqr.io')
      // .set('accept: */*')
      // .set('accept-language: en-GB,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,en-US;q=0.6,zh-CN;q=0.5,zh;q=0.4')
      // .set('content-type: application/json')
      // .set('origin: https://demo.vietqr.io')
      // .set('referer: https://demo.vietqr.io/')
      // .set('sec-fetch-dest: empty')
      // .set('sec-fetch-mode: cors')
      // .set('sec-fetch-site: same-site')
      // .set(
      //   'user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      // )
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(dataParam))
      .then(res => {
        if (res.body && res.body.data && isNotEmptyStringValue(res.body.code) && res.body.code === '00') {
          resolve(res.body.data);
        } else {
          resolve(undefined);
        }
      })
      .catch(error => {
        Logger.error(error);
        resolve(undefined);
      });
  });
}

async function createVietQR(accountNo, accountName, acqId, amount, addInfo) {
  let dataParam = {
    accountNo: accountNo, // số TK người nhận
    accountName: accountName, // Tên người nhận
    acqId: acqId, // code ngân hàng
    addInfo: addInfo, // nội dung chuyển tiền
    amount: amount, // số tiền
    format: 'text',
    template: 'compact',
  };
  return await new Promise(async (resolve, reject) => {
    await chai
      .request('https://api.vietqr.io/v2')
      .post(`/generate`)
      .set('x-client-id', 'd451c801-209c-45eb-a875-12893alskdj')
      .set('x-api-key', 'fc4d82ab-bf6d-49bf-aa96-102938alskd')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(dataParam))
      .then(res => {
        resolve(res.body);
      })
      .catch(error => {
        Logger.error(error);
        reject('failed');
      });
  });
}

//bankBinID: Mã định danh ngân hàng (thường gọi là BIN) 6 chữ số, quy đinh bởi ngân hàng nước
async function createQuickLinkVietQR(bankBinID, accountNumber) {
  let qrCodeLink = `https://img.vietqr.io/image/${bankBinID}-${accountNumber}-compact.png`;
  return qrCodeLink;
}

async function getBankList() {
  return await new Promise(async (resolve, reject) => {
    await chai
      .request('https://api.vietqr.io')
      .get(`/v2/banks`)
      .set('x-client-id', 'd451c801-209c-45eb-a875-12398102askjd')
      .set('x-api-key', 'fc4d82ab-bf6d-49bf-aa96-38923kjsd')
      .set('Content-Type', 'application/json')
      .then(res => {
        resolve(res.body);
      })
      .catch(error => {
        Logger.error(error);
        reject('failed');
      });
  });
}

module.exports = {
  crawlBankAccount,
  createVietQR,
  createQuickLinkVietQR,
  getBankList,
};
