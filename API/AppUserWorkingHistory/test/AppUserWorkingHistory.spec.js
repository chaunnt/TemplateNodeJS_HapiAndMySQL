/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/AppUserWorkingHistoryAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let workingHistoryId = null;

  before(done => {
    new Promise(async function (resolve, reject) {
      let advanceUserData = await TestFunctions.loginUser();
      token = advanceUserData.token;
      resolve();
    }).then(() => done());
  });

  // ============================ CREATE NEW WORKING HISTORY ==================================

  it(`/AppUserWorkingHistory/advanceUser/createAppUserWorkingHistory - Trạm tạo phiếu phân công thành công! (input hợp lệ) `, done => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/createAppUserWorkingHistory`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        workingHistoryId = res.body.data[0];
        done();
      });
  });

  // =============== API GET LIST WORKING HISTORY ============

  it(`/AppUserWorkingHistory/advanceUser/getListWorkingHistory - Trạm lấy danh phiếu phân công thành công! (input hợp lệ ) `, done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/getListWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/getListWorkingHistory - Trạm lấy danh phiếu phân công thành công! (lọc theo startDate endDate ) `, done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
      startDate: 20230908,
      endDate: 20230908,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/getListWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/getListWorkingHistory - Trạm lấy danh phiếu phân công thất bại! (input không hợp lệ) `, done => {
    const body = {
      filter: {},
      skip: -1, // Sai
      limit: 20,
      startDate: '08/09/2023', // Sai
      endDate: 20230908,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/getListWorkingHistory`)
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

  // =============== API GET DETAIL WORKING HISTORY ============

  it(`/AppUserWorkingHistory/advanceUser/getDetailWorkingHistory - Trạm lấy chi tiết phiếu phân công thành công! (input hợp lệ ) `, done => {
    const body = {
      id: workingHistoryId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/getDetailWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/getDetailWorkingHistory - Trạm lấy chi tiết phiếu phân công thất bại! (input hợp không lệ ) `, done => {
    const body = {
      id: -2121, //Sai
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/getDetailWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/getDetailWorkingHistory - Trạm lấy chi tiết phiếu phân công thất bại! (Lấy phiếu cảu trạm khác) `, done => {
    const body = {
      id: 2116,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/getDetailWorkingHistory`)
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

  // =============== API APPROVED WORKING HISTORY ============

  it(`/AppUserWorkingHistory/advanceUser/approvedWorkingHistory - Trạm duyệt phiếu phân công thành công!`, done => {
    const body = {
      id: workingHistoryId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/approvedWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/approvedWorkingHistory - Trạm duyệt phiếu phân công thất bại! (input không hợp lệ)`, done => {
    const body = {
      id: -2121,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/approvedWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/approvedWorkingHistory - Trạm duyệt phiếu phân công thất bại! (Duyệt phiếu của trạm khác)`, done => {
    const body = {
      id: 2116,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/approvedWorkingHistory`)
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

  // =============== API CANCEL WORKING HISTORY ============

  it(`/AppUserWorkingHistory/advanceUser/cancelWorkingHistory - Trạm hủy phiếu phân công thành công!`, done => {
    const body = {
      id: workingHistoryId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/cancelWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/cancelWorkingHistory - Trạm hủy phiếu phân công thất bại! (input không hợp lệ)`, done => {
    const body = {
      id: -2121,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/cancelWorkingHistory`)
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

  it(`/AppUserWorkingHistory/advanceUser/cancelWorkingHistory - Trạm duyệt phiếu phân công thất bại! (Duyệt phiếu của trạm khác)`, done => {
    const body = {
      id: 2116,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserWorkingHistory/advanceUser/cancelWorkingHistory`)
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
