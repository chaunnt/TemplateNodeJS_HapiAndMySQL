/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const faker = require('faker');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/AppUserVehicleSettingAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token;
  let appUserId;

  before(done => {
    new Promise(async function (resolve, reject) {
      let customer = await TestFunctions.loginUser();
      token = customer.token;
      appUserId = customer.appUserId;
      resolve();
    }).then(() => done());
  });

  //// =================TEST CASE API UPDATE SETTING VEHICLE USER ========================

  it('Cập nhật setting vehicle của người dùng thành công! (id >= 0)', done => {
    const body = {
      id: 0,
      data: {
        appUserId: appUserId,
        vehicleIdentity: '13D13112',
        vehicleExpiryDateBHTNDS: 20230816,
        vehicleExpiryDateBHTV: 20230815,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicleSetting/user/userUpdateSettingVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Cập nhật setting vehicle của người dùng thất bại! (appUserId < 0) ', done => {
    const body = {
      id: -1,
      data: {
        appUserId: appUserId,
        vehicleIdentity: '13D13112',
        vehicleExpiryDateBHTNDS: 20230816,
        vehicleExpiryDateBHTV: 20230815,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicleSetting/user/userUpdateSettingVehicle`)
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

  it('Cập nhật setting vehicle của người dùng thất bại! (vehicleExpiryDateBHTNDS || vehicleExpiryDateBHTV < 0) ', done => {
    const body = {
      id: 0,
      data: {
        appUserId: appUserId,
        vehicleIdentity: '13D13112',
        vehicleExpiryDateBHTNDS: -20230816,
        vehicleExpiryDateBHTV: 20230815,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicleSetting/user/userUpdateSettingVehicle`)
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

  it('Cập nhật setting vehicle của người dùng thất bại! (id || vehicleExpiryDateBHTNDS || vehicleExpiryDateBHTV  = string) ', done => {
    const body = {
      id: 0,
      data: {
        appUserId: appUserId,
        vehicleIdentity: '13D13112',
        vehicleExpiryDateBHTNDS: 'yyyymmdd',
        vehicleExpiryDateBHTV: 'yyyymmdd',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicleSetting/user/userUpdateSettingVehicle`)
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

  it('Cập nhật setting vehicle của người dùng thất bại! (cập nhật setting vehicle của người khác) ', done => {
    const body = {
      id: 171,
      data: {
        appUserId: appUserId,
        vehicleIdentity: '13D13112',
        vehicleExpiryDateBHTNDS: 20230815,
        vehicleExpiryDateBHTV: 20230815,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicleSetting/user/userUpdateSettingVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });
});
