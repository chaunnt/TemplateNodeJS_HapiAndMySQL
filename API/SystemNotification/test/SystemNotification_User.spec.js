/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/SystemNotificationResourceAccess');

const SystemNotificationTestFunction = require('./SystemNotificationTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let systemNotificationId = null;

  before(done => {
    new Promise(async function (resolve, reject) {
      let customerData = await TestFunctions.loginCustomer();
      console.log(customerData.token);
      token = customerData.token;
      resolve();
    }).then(() => done());
  });

  // // ================ /SystemNotification/user/getList=============================

  it('User lấy danh sách thông báo thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 10,
    };

    SystemNotificationTestFunction.userGetAllSystemNotification(token, body)
      .then(res => {
        systemNotificationId = res.data[0].systemNotificationId;
        done();
      })
      .catch(error => done(error));
  });

  // // ================ /SystemNotification/findById =============================

  it('Admin Lấy chi tiết thông báo thành công', done => {
    const body = {
      id: systemNotificationId,
    };

    SystemNotificationTestFunction.userGetDetailSystemNotification(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin Lấy chi tiết thông báo thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/findById`)
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

  it('Admin Lấy chi tiết thông báo thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/findById`)
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
