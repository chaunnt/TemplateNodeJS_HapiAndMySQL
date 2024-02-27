/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationServicesResourceAccess');

const { SERVICE_TYPES } = require('../StationServicesConstants');
const StationServicesTestFunction = require('./StationServicesTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let stationServicesId = null;

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // ================ /StationServices/advanceUser/insert =============================

  it('Trung tâm tạo dịch vụ thành công', done => {
    const body = {
      serviceType: SERVICE_TYPES.EXTEND_ISSURANCE_BODY,
      servicePrice: 0,
      serviceName: 'Gia hạn BH thân vỏ',
    };

    StationServicesTestFunction.advanceUserInsertStationServices(token, body)
      .then(res => {
        stationServicesId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Trung tâm tạo dịch vụ thất bại (serviceType không hợp lệ)', done => {
    const body = {
      serviceType: 9999,
      servicePrice: 0,
      serviceName: 'Gia hạn BH thân vỏ',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationServices/advanceUser/insert`)
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

  it('Trung tâm tạo dịch vụ thất bại (serviceName không hợp lệ)', done => {
    const body = {
      serviceType: SERVICE_TYPES.EXTEND_ISSURANCE_BODY,
      servicePrice: 0,
      serviceName: '', //Sai
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationServices/advanceUser/insert`)
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

  // // ================ /StationServices/advanceUser/list =============================

  it('Admin lấy danh sách dịch vụ thành công', done => {
    const body = {};

    StationServicesTestFunction.advanceUserGetAllStationServices(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // ================ /StationServices/deleteById =============================

  it('Trung tâm xóa dịch vụ thành công', done => {
    const body = {
      id: stationServicesId,
    };

    StationServicesTestFunction.advanceUserDeleteStationServices(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Trung tâm xóa dịch vụ thất bại (id âm)', done => {
    const body = {
      id: -1,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationServices/advanceUser/delete`)
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

  it('Trung tâm xóa dịch vụ thất bại (id không là số)', done => {
    const body = {
      id: 'abc',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationServices/advanceUser/delete`)
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
