/* Copyright (c) 2022-2024 Reminano */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../API/Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function sendVoiceOTP(phoneNumber, otp) {
  console.log(`sendVoiceOTP: ${phoneNumber} - ${otp}`);
  let reqBody = {
    otpcode: otp,
    phone: phoneNumber,
    username: 'kenken',
    password: '123098asdlj12',
  };
  console.log(reqBody);
  const api = 'http://otp.ezcall.vn';
  const { body } = await chai.request(`${api}`).post(`/api/autodial.php`).set('Content-type', 'application/json').send(reqBody);
  console.log(body);
  // todo: cập nhật lại khi có api
  return true;
}
module.exports = {
  sendVoiceOTP,
};
