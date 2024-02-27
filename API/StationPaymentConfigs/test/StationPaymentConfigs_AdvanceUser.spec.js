/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationPaymentConfigsResourceAccess');

const StationPaymentConfigsTestFunction = require('./StationPaymentConfigsTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // // ================ /StationPaymentConfigs/advanceUser/detail =============================

  it('Trạm lấy chi tiết cấu hình thanh toán của trạm thành công', done => {
    const body = {};

    StationPaymentConfigsTestFunction.advanceUserGetDetailStationPaymentConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // ================ /StationPaymentConfigs/advanceUser/updateBankConfigs =============================
  it('Trạm cập nhật cấu hình thanh toán ngân hàng thành công', done => {
    const body = {
      bankConfigs: [
        {
          accountName: 'Trung tâm đăng kiểm xe cơ giới 2004D - Thái Nguyên 2',
          bankId: '970408',
          accountNumber: ' 8386499999',
          bankName: 'Techcombank',
        },
      ],
    };

    StationPaymentConfigsTestFunction.advanceUserUpdateBankConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Trạm cập nhật cấu hình thanh toán ngân hàng thất bại (input không hợp lệ)', done => {
    const body = {
      bankConfigs: [
        {
          accountName: 'Trung tâm đăng kiểm xe cơ giới 2004D - Thái Nguyên 2',
          bankId: '', // Sai
          accountNumber: '', // Sai
          bankName: '', // Sai
        },
      ],
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationPaymentConfigs/advanceUser/updateBankConfigs`)
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

  // // ================ /StationPaymentConfigs/advanceUser/updateMomoBusinessConfigs =============================

  it('Trạm cập nhật cấu hình thanh toán momo doanh nghiệp thành công', done => {
    const body = {
      momoBusinessConfigs: {
        secretKey: 'OuADhuCnfTHdidDYYd4Jg1N7bBkrshQQ',
        accessKey: 'QC7GJGjij0i6OinO',
        partnerCode: 'MOMOXQQ820230508',
      },
    };

    StationPaymentConfigsTestFunction.advanceUserUpdateMomoBusinessConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // ================/StationPaymentConfigs/advanceUser/updateMomoPersonalConfigs =============================

  it('Trạm cập nhật cấu hình thanh toán momo cá nhân thành công', done => {
    const body = {
      momoPersonalConfigs: {
        phone: '0886743097',
        QRCode: 'https://dev320-api.captain.ttdk.com.vn/uploads/media/y9sdx6ae6m9zbvv04x0xq_2023-12-01T09:43:37.900Z.jpeg',
      },
    };

    StationPaymentConfigsTestFunction.advanceUserUpdateMomoPersonalConfigs(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });
});
