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

const app = require('../../../server');

describe(`Tests customer Receipt `, function () {
  let token = '';
  let staffToken = '';
  let dataDisablePaymentToken = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let data = await TestFunctions.loginUser();
      token = data.token;
      let staffData = await TestFunctions.loginStaff();
      staffToken = staffData.token;
      let dataDisablePayment = await TestFunctions.loginUserDisablePayment();
      dataDisablePaymentToken = dataDisablePayment.token;
      resolve();
    }).then(() => done());
  });
  // it(`Report`, done => {
  //   const body = { stationsId: 1 };
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerStatistical/report`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });

  // it(`Report by startDate and EndDate`, done => {
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerStatistical/report`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });

  // it(`Report all station by startDate and EndDate`, done => {
  //   const body = {
  //     startDate: '2021-10-20T23:43:53.000Z',
  //     endDate: '2021-10-23T23:43:53.000Z',
  //   };
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerStatistical/reportAllStation`)
  //     .set('Authorization', `Bearer ${staffToken}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });

  it(`/CustomerReceipt/advanceUser/userCreate . Mô tả: Tạo hóa đơn thành công! (input hợp lệ)`, done => {
    const body = {
      customerReceiptName: 'Nguyen van test2',
      customerReceiptPhone: '0909459787',
      customerReceiptAmount: 10000000,
      customerReceiptContent: 'INSPECTION_FEE',
      customerReceiptNote: '1',
      paymentMethod: 'cash',
      customerReceiptInternalRef: 0,
      customerVehicleIdentity: '15A25870',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerReceipt/advanceUser/userCreate`)
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
  it(`/CustomerReceipt/advanceUser/userCreate . Mô tả: Tạo hoa đơn không thành công do Trạm disable Payment!`, done => {
    const body = {
      customerReceiptName: 'Nguyen van test',
      customerReceiptPhone: '0909459787',
      customerReceiptAmount: 10000000,
      customerReceiptContent: 'INSPECTION_FEE',
      customerReceiptNote: '1',
      paymentMethod: 'cash',
      customerReceiptInternalRef: 0,
      customerVehicleIdentity: '15A25870',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerReceipt/advanceUser/userCreate`)
      .set('Authorization', `Bearer ${dataDisablePaymentToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });

  it(`/CustomerReceipt/advanceUser/userCreate . Mô tả: Tạo hóa đơn không thành công! (customerReceiptPhone là chuỗi rỗng : "")`, done => {
    const body = {
      customerReceiptName: 'Nguyen van test2',
      customerReceiptPhone: '',
      customerReceiptAmount: 10000000,
      customerReceiptContent: 'INSPECTION_FEE',
      customerReceiptNote: '1',
      paymentMethod: 'cash',
      customerReceiptInternalRef: 0,
      customerVehicleIdentity: '15A25870',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerReceipt/advanceUser/userCreate`)
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

  it(`/CustomerReceipt/advanceUser/userCreate . Mô tả: Tạo hóa đơn không thành công! (không truyền customerReceiptPhone)`, done => {
    const body = {
      customerReceiptName: 'Nguyen van test2',
      customerReceiptAmount: 10000000,
      customerReceiptContent: 'INSPECTION_FEE',
      customerReceiptNote: '1',
      paymentMethod: 'cash',
      customerReceiptInternalRef: 0,
      customerVehicleIdentity: '15A25870',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerReceipt/advanceUser/userCreate`)
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

  it(`/CustomerReceipt/advanceUser/userCreate . Mô tả: Tạo hóa đơn không thành công! (truyền customerReceiptPhone : " ")`, done => {
    const body = {
      customerReceiptName: 'Nguyen van test2',
      customerReceiptPhone: ' ',
      customerReceiptAmount: 10000000,
      customerReceiptContent: 'INSPECTION_FEE',
      customerReceiptNote: '1',
      paymentMethod: 'cash',
      customerReceiptInternalRef: 0,
      customerVehicleIdentity: '15A25870',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerReceipt/advanceUser/userCreate`)
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
