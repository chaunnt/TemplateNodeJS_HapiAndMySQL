/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function checkPhoneNumber(phoneNumber) {
  return new Promise((resolve, reject) => {
    chai
      .request('http://ttdk-checkphone.captain.ttdk.com.vn')
      .get('/checkmobilenumber')
      .set('Content-Type', 'application/json; charset=utf-8')
      .query({ phoneNumber: phoneNumber })
      .end((err, res) => {
        if (err) {
          console.error(err);
          return resolve(undefined);
        }

        if (res && res.statusCode === 200) {
          const data = res.text;
          // nha mang khong hop le "", hop le tra ve ma nha mang 01 -> 09
          if (data) {
            return resolve(data);
          } else {
            return resolve(0);
          }
        } else {
          resolve(undefined);
        }
      });
  });
}

module.exports = {
  checkPhoneNumber,
};
