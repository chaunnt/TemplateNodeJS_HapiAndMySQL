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
      let staffData = await TestFunctions.loginCustomer();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // // ================ /StationPaymentConfigs/user/getPaymentConfigByStation =============================

  it('User lấy chi tiết cấu hình thanh toán của trạm thành công', done => {
    const body = {
      filter: {
        stationsId: 36,
      },
    };

    StationPaymentConfigsTestFunction.userGetPaymentConfigByStation(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('User lấy chi tiết cấu hình thanh toán của trạm thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationPaymentConfigs/user/getPaymentConfigByStation`)
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

  it('User lấy chi tiết cấu hình thanh toán của trạm thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationPaymentConfigs/user/getPaymentConfigByStation`)
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
