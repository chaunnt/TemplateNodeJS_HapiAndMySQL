/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/SystemPromoBannersResourceAccess');

const SystemPromoBannersTestFunction = require('./SystemPromoBannersTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let systemPromoBannersId = null;

  before(done => {
    new Promise(async function (resolve, reject) {
      let customerData = await TestFunctions.loginCustomer();
      console.log(customerData.token);
      token = customerData.token;
      resolve();
    }).then(() => done());
  });

  // // ================ /SystemPromoBanners/user/getList=============================

  it('User lấy danh sách banner quảng cáo thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 10,
    };

    SystemPromoBannersTestFunction.userGetAllSystemPromoBanners(token, body)
      .then(res => {
        console.log(res);
        systemPromoBannersId = res.data[0].systemPromoBannersId;
        done();
      })
      .catch(error => done(error));
  });

  // // ================ /SystemPromoBanners/findById =============================

  it('Admin Lấy chi tiết banner quảng cáo thành công', done => {
    const body = {
      id: systemPromoBannersId,
    };

    SystemPromoBannersTestFunction.userGetDetailSystemPromoBanners(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin Lấy chi tiết banner quảng cáo thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/findById`)
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

  it('Admin Lấy chi tiết banner quảng cáo thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/findById`)
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
