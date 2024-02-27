/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationServicesResourceAccess');

const StationServicesTestFunction = require('./StationServicesTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let customerData = await TestFunctions.loginCustomer();
      console.log(customerData.token);
      token = customerData.token;
      resolve();
    }).then(() => done());
  });

  // // ================ /StationServices/user/getListStationService =============================

  it('User lấy danh sách dịch vụ của trạm thành công', done => {
    const body = {
      filter: {
        stationsId: 36,
      },
    };

    StationServicesTestFunction.userGetAllStationServices(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('User lấy danh sách dịch vụ của trạm thất bại', done => {
    const body = {
      filter: {
        stationsId: -1, // Sai
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationServices/user/getListStationService`)
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
