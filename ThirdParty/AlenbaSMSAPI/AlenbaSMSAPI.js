/* Copyright (c) 2021-2023 Reminano */
'use strict';
require('dotenv').config();

const chai = require('chai');
const chaiHttp = require('chai-http');
const Logger = require('../../utils/logging');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

// sample: https://api.abenla.com/api/SendSms?loginName=ABHT51L&sign=6e07f189b452272d9c413205677f594e&serviceTypeId=535&phoneNumber=0343902960&message=9876&brandName=CHOVAY&callBack=false&smsGuid=1
async function sendOTPBySMSToPhoneNumber(phoneNumber, otp) {
  if (process.env.ALENBA_SMS_ENABLE * 1 !== 1) {
    Logger.info(`ALENBA_SMS_ENABLE is disable ${process.env.ALENBA_SMS_ENABLE}`);
    return 'ok';
  }
  let _UserName = process.env.ALENBA_USERNAME || 'AFASD123';
  let _LoginPassword = process.env.ALENBA_LOGINPASSWORD || 'D6L4LPDDX44';
  let _Sign = process.env.ALENBA_SIGN || '6e07f189b452272d9c413205677f594e';
  let _Brandname = process.env.ALENBA_BRANDNAME || 'CHOVAY';
  return new Promise((resolve, reject) => {
    chai
      .request(
        `https://api.abenla.com/api/SendSms?loginName=${_UserName}&sign=${_Sign}&serviceTypeId=535&phoneNumber=${phoneNumber}&message=${otp}&brandName=${_Brandname}&callBack=false&smsGuid=1`,
      )
      .get(`/AppUsers/registerUser`)
      .end((err, res) => {
        if (err) {
          Logger.error(`sendOTPBySMSToPhoneNumber ${phoneNumber} ${otp}`);
          Logger.error(err);
          resolve(undefined);
        } else {
          resolve(res.body);
        }
      });
  });
}

module.exports = {
  sendOTPBySMSToPhoneNumber,
};
