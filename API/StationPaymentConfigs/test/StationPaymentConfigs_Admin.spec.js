/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationPaymentConfigsResourceAccess');

const StationPaymentConfigsTestFunction = require('./StationPaymentConfigsTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginStaff();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // ================ /StationPaymentConfigs/find =============================

  it('Admin lấy cấu hình thanh toán của tất cả các trạm thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };

    StationPaymentConfigsTestFunction.adminGetAllStationPaymentConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // ================ /StationPaymentConfigs/findById =============================

  it('Admin lấy chi tiết cấu hình thanh toán của trạm thành công', done => {
    const body = {
      id: 36,
    };

    StationPaymentConfigsTestFunction.adminGetDetailStationPaymentConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin lấy chi tiết cấu hình thanh toán của trạm thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationPaymentConfigs/findById`)
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

  it('Admin lấy chi tiết cấu hình thanh toán của trạm thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationPaymentConfigs/findById`)
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
