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

const Model = require('../resourceAccess/StationWorkingHoursAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token;
  let stationWorkingHoursId;

  before(done => {
    new Promise(async function (resolve, reject) {
      let customer = await TestFunctions.loginUser();
      token = customer.token;
      resolve();
    }).then(() => done());
  });

  //// =================TEST CASE API GET WORKINGHOURS OF STATION ========================

  it('/StationWorkingHours/advanceUser/findByStationId (Lấy workinghours của trạm thành công! - token người dùng hợp lệ)', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/findByStationId`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        stationWorkingHoursId = res.body.data[0].stationWorkingHoursId;
        done();
      });
  });

  it('/StationWorkingHours/advanceUser/findByStationId (Lấy workinghours của trạm thất bại! - token người dùng không hợp lệ)', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/findByStationId`)
      .set('Authorization', `Bearer ${'abcdefghiklmnopqrstuvwxyz'}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  //// =================TEST CASE API UPDATE WORKINGHOURS OF STATION ========================

  it('/StationWorkingHours/advanceUser/updateById (Thay đổi workinghours của trạm thành công! (input hợp lệ)', done => {
    const body = {
      id: stationWorkingHoursId,
      data: {
        startTime: null,
        endTime: null,
        enableWorkDay: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/updateById`)
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

  it('/StationWorkingHours/advanceUser/updateById (Thay đổi workinghours của trạm thất bại! (Lịch làm việc không phải của trạm đang đăng nhập)', done => {
    const body = {
      id: 160,
      data: {
        startTime: '07:30',
        endTime: '16:30',
        enableWorkDay: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/updateById`)
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

  it('/StationWorkingHours/advanceUser/updateById (Thay đổi workinghours của trạm thất bại! (id của workingHours < 0)', done => {
    const body = {
      id: -1,
      data: {
        startTime: '07:30',
        endTime: '16:30',
        enableWorkDay: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/updateById`)
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

  it('/StationWorkingHours/advanceUser/updateById (Thay đổi workinghours của trạm thất bại! (id của workingHours là string)', done => {
    const body = {
      id: 'abc',
      data: {
        startTime: '07:30',
        endTime: '16:30',
        enableWorkDay: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/updateById`)
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

  it('/StationWorkingHours/advanceUser/updateById (Thay đổi workinghours của trạm thất bại! (data update không phải string)', done => {
    const body = {
      id: 135,
      data: {
        startTime: 0730,
        endTime: '16:30',
        enableWorkDay: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/updateById`)
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

  it('/StationWorkingHours/advanceUser/updateById (Thay đổi workinghours của trạm thất bại! (data update không đúng định dạng HH:mm)', done => {
    const body = {
      id: 135,
      data: {
        startTime: '07:60',
        endTime: '16:300',
        enableWorkDay: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationWorkingHours/advanceUser/updateById`)
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
