/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/CustomerMessageResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let messageId;
  let token = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      token = staffData.token;
      done();
      resolve();
    });
  });

  it('POST /CustomerMessage/advanceUser/getReportList Lấy report tin nhắn thành công', done => {
    const body = {
      startDate: '20/01/2023',
      endDate: '01/12/2023',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerMessage/advanceUser/getReportList`)
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

  it('POST /CustomerMessage/advanceUser/getReportList Lấy report tin nhắn thất bại (startDate > enDate)', done => {
    const body = {
      startDate: '01/12/2023',
      endDate: '20/01/2023',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerMessage/advanceUser/getReportList`)
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

  it('POST /CustomerMessage/advanceUser/getReportList Lấy report tin nhắn thất bại (startDate, enDate khác string)', done => {
    const body = {
      startDate: 1,
      endDate: '20/01/2023',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerMessage/advanceUser/getReportList`)
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

  it('POST /CustomerMessage/advanceUser/getReportList Lấy report tin nhắn thất bại (Không chọn startDate hoặc endDate)', done => {
    const body = {
      endDate: '20/01/2023',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerMessage/advanceUser/getReportList`)
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

  it('POST /CustomerMessage/advanceUser/getReportList Lấy report tin nhắn thất bại (startDate hoặc endDate khác format DD/MM/YYYY)', done => {
    const body = {
      startDate: '2023/01/30',
      endDate: '2023/70/30',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerMessage/advanceUser/getReportList`)
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
