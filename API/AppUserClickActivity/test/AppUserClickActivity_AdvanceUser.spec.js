/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/AppUserClickActivityAccess');
const { TARGET_ID } = require('../AppUserClickActivityConstant');
const AppUserClickActivityTestFunction = require('./AppUserClickActivityTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let customerData = await TestFunctions.loginCustomer();
      token = customerData.token;
      resolve();
    }).then(() => done());
  });

  it('Người dùng click vào banner dối tác thành công (input hợp lệ)', done => {
    const body = {
      listClick: [
        {
          targetId: TARGET_ID.MOMO_PARTNER,
          totalClick: 1,
        },
      ],
    };

    AppUserClickActivityTestFunction.userClickActivity(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Người dùng click vào banner dối tác thất bại (input không hợp lệ)', done => {
    const body = {
      targetId: TARGET_ID.MOMO_PARTNER, // Sai
      totalClick: 1,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserClickActivity/user/clickActivity`)
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

  it('Người dùng click vào banner dối tác thất bại (input không hợp lệ)', done => {
    const body = {
      listClick: [
        {
          targetId: -1, // Sai
          totalClick: 1,
        },
      ],
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserClickActivity/user/clickActivity`)
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

  it('Người dùng click vào banner dối tác thất bại (input không hợp lệ)', done => {
    const body = {
      listClick: [
        {
          targetId: -1, // Sai
          totalClick: 0,
        },
      ],
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserClickActivity/user/clickActivity`)
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
