/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationMessageConfigsAccess');
const { SETTING_STATUS } = require('../StationMessageConfigsConstant');

const StationMessageConfigsTestFunction = require('./StationMessageConfigsTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // ================ advanceUserGetStationMessageConfigs =============================

  it('Trạm lấy cài đặt tin nhắn tự động thành công', done => {
    const body = {};

    StationMessageConfigsTestFunction.advanceUserGetStationMessageConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // ================  /StationMessageConfigs/advanceUser/updateStationMessageConfigs =============================

  it('Trạm cập nhật cài đặt tin nhắn tự động thành công', done => {
    const body = {
      data: {
        enableAutoSentNotiBefore30Days: SETTING_STATUS.DISABLE,
        enableAutoSentNotiBefore15Days: SETTING_STATUS.DISABLE,
        enableNotiByAPNS: SETTING_STATUS.DISABLE,
        enableNotiBySmsCSKH: SETTING_STATUS.DISABLE,
        messageTemplateSmsCSKH: 1,
      },
    };

    StationMessageConfigsTestFunction.advanceUserUpdateStationMessageConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Trạm cập nhật cài đặt tin nhắn tự động thất bại (input không hợp lệ)', done => {
    const body = {
      data: {
        enableAutoSentNotiBefore30Days: 11, //Sai
        enableAutoSentNotiBefore15Days: SETTING_STATUS.DISABLE,
        enableNotiByAPNS: SETTING_STATUS.DISABLE,
        enableNotiBySmsCSKH: SETTING_STATUS.DISABLE,
        messageTemplateSmsCSKH: 1,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationMessageConfigs/advanceUser/updateStationMessageConfigs`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Trạm cập nhật cài đặt tin nhắn tự động thất bại (enableAutoSentNotiBefore30Days không là số)', done => {
    const body = {
      data: {
        enableAutoSentNotiBefore30Days: 'abc', //Sai
        enableAutoSentNotiBefore15Days: SETTING_STATUS.DISABLE,
        enableNotiByAPNS: SETTING_STATUS.DISABLE,
        enableNotiBySmsCSKH: SETTING_STATUS.DISABLE,
        messageTemplateSmsCSKH: 1,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationMessageConfigs/advanceUser/updateStationMessageConfigs`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });
});
