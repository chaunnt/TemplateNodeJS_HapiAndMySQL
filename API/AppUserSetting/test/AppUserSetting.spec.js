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

const Model = require('../resourceAccess/AppUserSettingAccess');
const VehicleModel = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const StationModel = require('../../Stations/resourceAccess/StationsResourceAccess');
const UserModel = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserVehicleModel = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');

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

  //// =================TEST CASE API GET SETTING USER ========================

  it('Lấy setting của người dùng thành công! (id >= 0)', done => {
    const body = {
      id: 1549,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/findById`)
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

  it('Lấy setting của người dùng thất bại! (appUserId < 0) ', done => {
    const body = {
      id: -1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/findById`)
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

  it('Lấy setting của người dùng thất bại! (appUserId là chuỗi kí tự hoặc kí tự rỗng "") ', done => {
    const body = {
      id: 'abc',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/findById`)
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

  it('Lấy setting của người dùng thất bại! (Không truyền appUserId) ', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/findById`)
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

  // //// =================TEST CASE API UPDATE SETTING USER ========================

  it('Thay đổi setting từ người dùng thành công! (input hợp lệ)', done => {
    const body = {
      id: 1549,
      data: {
        enableAutoCheckRoadFee: 1,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/update`)
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

  it('Thay đổi setting từ người dùng thất bại! (appUserSettingId < 0)', done => {
    const body = {
      id: -1,
      data: {
        enableAutoCheckRoadFee: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/update`)
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

  it('Thay đổi setting từ người dùng thất bại! (Không truyền trường appUserSettingId)', done => {
    const body = {
      // id: "",
      data: {
        enableAutoCheckRoadFee: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/update`)
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

  it('Thay đổi setting từ người dùng thất bại! (Một trong các trường của input data là ký tự)', done => {
    const body = {
      id: '',
      data: {
        enableAutoCheckRoadFee: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/update`)
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

  it('Thay đổi setting từ người dùng thất bại! (1 trong các trường thông tin update là ký tự hoặc khác giá trị 0 || 1)', done => {
    const body = {
      id: 1549,
      data: {
        enableAutoCheckRoadFee: 9,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/update`)
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

  it('Thay đổi setting từ người dùng thất bại! (input data rỗng)', done => {
    const body = {
      // id: 1549,
      // data: {
      //   enableAutoCheckRoadFee: 9
      // }
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserSetting/user/update`)
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
