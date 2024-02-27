/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');
const moment = require('moment');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/SMSMessageResourceAccess');

const SMSMessageTestFunction = require('./SMSMessageTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let phoneNumber = `0774998264`;
  let apikey = `e2d07e80-a1f8-11ed-a8fc-0242ac120002`;
  let query = `phoneNumber=${phoneNumber}&apiKey=${apikey}`;

  it('Người dùng đặt lịch qua SMS thành công', done => {
    let licensePlates = `12D1${moment().format('mmss')}`;
    let dateSchedule = moment().add(3, 'days').format('DD/MM/YYYY');
    let body = {
      type: 'received',
      number: `033564${moment().format('mmss')}`,
      message: `5012D ${licensePlates} ${dateSchedule}`,
    };

    SMSMessageTestFunction.processSMS(query, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Người dùng đặt lịch qua SMS thất bại (BSX không hợp lệ)', done => {
    let licensePlates = `12D1$$${moment().format('mmss')}`; // Sai
    let dateSchedule = moment().add(3, 'days').format('DD/MM/YYYY');
    let body = {
      type: 'received',
      number: `033564${moment().format('mmss')}`,
      message: `5012D ${licensePlates} ${dateSchedule}`,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/robot/insert${query ? `?${query}` : ''}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch qua SMS thất bại (dateSchedule (quá khứ) không hợp lệ)', done => {
    let licensePlates = `12D1${moment().format('mmss')}`;
    let dateSchedule = moment().add(-3, 'days').format('DD/MM/YYYY'); // Sai
    let body = {
      type: 'received',
      number: `033564${moment().format('mmss')}`,
      message: `5012D ${licensePlates} ${dateSchedule}`,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/robot/insert${query ? `?${query}` : ''}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch qua SMS thất bại (sđt không hợp lệ)', done => {
    let licensePlates = `12D1${moment().format('mmss')}`;
    let dateSchedule = moment().add(-3, 'days').format('DD/MM/YYYY'); // Sai
    let body = {
      type: 'received',
      number: ``,
      message: `5012D ${licensePlates} ${dateSchedule}`,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/robot/insert${query ? `?${query}` : ''}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch qua SMS thất bại (đặt lịch vào ngày nghỉ của trạm)', done => {
    let licensePlates = `12D1${moment().format('mmss')}`;
    let dateSchedule = moment().add(1, 'weeks').day(0).format('DD/MM/YYYY'); // Ngày chủ nhật
    let body = {
      type: 'received',
      number: `033564${moment().format('mmss')}`,
      message: `5012D ${licensePlates} ${dateSchedule}`,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/robot/insert${query ? `?${query}` : ''}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch qua SMS thành công (ngày đặt hẹn sai format hệ thống tự xử lý)', done => {
    let licensePlates = `12D1${moment().format('mmss')}`;
    let dateSchedule = moment().add(3, 'days').format('YYYYMMDD');
    let body = {
      type: 'received',
      number: `033564${moment().format('mmss')}`,
      message: `5012D ${licensePlates} ${dateSchedule}`,
    };

    SMSMessageTestFunction.processSMS(query, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Người dùng đặt lịch qua SMS thành công (stationsId không hợp lệ)', done => {
    let licensePlates = `12D1${moment().format('mmss')}`;
    let dateSchedule = moment().add(3, 'days').format('YYYYMMDD');
    let body = {
      type: 'received',
      number: `033564${moment().format('mmss')}`,
      message: `5012D555D ${licensePlates} ${dateSchedule}`,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/robot/insert${query ? `?${query}` : ''}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Không cho phép đặt lịch khi chưa hủy / hoàn tất', async () => {
    try {
      let licensePlates = `12D1${moment().format('mmss')}`;
      let dateSchedule = moment().add(3, 'days').format('DD/MM/YYYY');
      let body = {
        type: 'received',
        number: `033564${moment().format('mmss')}`,
        message: `5012D ${licensePlates} ${dateSchedule}`,
      };

      await SMSMessageTestFunction.processSMS(query, body);

      const secondCreateResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/SMSMessage/robot/insert${query ? `?${query}` : ''}`)
        .send(body);

      checkResponseStatus(secondCreateResponse, 500);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});
