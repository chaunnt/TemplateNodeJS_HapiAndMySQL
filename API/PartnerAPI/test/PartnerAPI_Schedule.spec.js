/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const moment = require('moment');

const { checkResponseStatus } = require('../../Common/test/Common');
const PartnerAPITestFunctions = require('./PartnerAPITestFunctions');
const { SCHEDULE_TYPE } = require('../../CustomerSchedule/CustomerScheduleConstants');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const app = require('../../../server');

describe(`Tests API Partner Momo`, function () {
  let scheduleId;
  const apikey = '06641c91-d30d-4934-bb5d-80cd2ae71b21';
  let phoneNumber = '0999999988';

  //============================ API ĐẶT LỊCH ==============================

  it('Partner  Đặt lịch hẹn thành công! (input hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `077777${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: 41,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    PartnerAPITestFunctions.partnerCreateCustomerSchedule(apikey, body)
      .then(res => {
        scheduleId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Partner Đặt lịch hẹn thất bại! (id trạm không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `077777${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: -1,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/createSchedule`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Partner đặt lịch hẹn thất bại! (BSX ký tự đặt biệt)', done => {
    const body = {
      licensePlates: "<.?>''---*", // Sai
      phone: `077777${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: -1,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/createSchedule`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Partner đặt lịch hẹn thất bại! (apiKey không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `077777${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: 41,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/createSchedule`)
      .set('apiKey', `abcdefhhikl`) // Sai
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 505);
        done();
      });
  });

  it('Partner đặt lịch thất bại (dateSchedule (quá khứ) không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(-3, 'days').format('DD/MM/YYYY'), // Sai
      time: '7h-9h',
      stationsId: 41,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/createSchedule`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên đặt lịch thất bại (đặt lịch vào ngày nghỉ của trạm)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(1, 'weeks').day(0).format('DD/MM/YYYY'), // Ngày chủ nhật
      time: '7h-9h',
      stationsId: 41,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/createSchedule`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Không cho phép đặt lịch khi chưa hủy / hoàn tất', async () => {
    try {
      const body = {
        licensePlates: `12D1${moment().format('mmss')}`,
        phone: `077777${moment().format('mmss')}`,
        fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
        email: faker.internet.email(),
        dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
        time: '7h-9h',
        stationsId: 41,
        notificationMethod: 'SMS',
        vehicleType: 1,
        licensePlateColor: 0,
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      };

      const cancelData = {
        customerScheduleId: null,
        reason: 'Sai thông tin phương tiện',
      };

      const createResponse = await PartnerAPITestFunctions.partnerCreateCustomerSchedule(apikey, body);

      cancelData.customerScheduleId = createResponse[0];

      const secondCreateResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/PartnerAPI/CustomerSchedule/user/createSchedule`)
        .set('apiKey', apikey)
        .send(body);

      checkResponseStatus(secondCreateResponse, 500);

      await PartnerAPITestFunctions.partnerCancelCustomerSchedule(apikey, cancelData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  // //====================== API LẤY CHI TIẾT LỊCH HẸN =====================================

  it('Partner lấy chi tiết lịch hẹ thành công!', done => {
    const body = {
      customerScheduleId: scheduleId,
    };
    PartnerAPITestFunctions.partnerGetDetailCustomerSchedule(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Partner lấy chi tiết lịch hẹ thất bại! (input không hợp lệ)', done => {
    const body = {
      customerScheduleId: -45, // Sai
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/getDetailSchedule`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  // ========================= API LẤY DANH SÁCH LỊCH HẸN ==========================

  it('Partner lấy danh sách lịch hẹn thành công!', done => {
    const body = {
      filter: {
        phone: phoneNumber,
      },
      skip: 0,
      limit: 20,
    };

    PartnerAPITestFunctions.partnerGetListCustomerSchedule(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // //======================== API HỦY LỊCH HẸN ======================================

  it('Partner hủy lịch hẹn thành công', done => {
    const body = {
      customerScheduleId: scheduleId,
      reason: 'abc',
    };

    PartnerAPITestFunctions.partnerCancelCustomerSchedule(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Partner hủy lịch hẹn thất bại! (Lịch của người khác)', done => {
    const body = {
      customerScheduleId: 456,
      reason: 'abc',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/cancelSchedule`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Partner hủy lịch hẹn thất bại! (input không hợp lệ)', done => {
    const body = {
      customerScheduleId: -456,
      reason: 'abc',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/cancelSchedule`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Partner hủy lịch hẹn thất bại! (hủy lịch đã hủy trước đó)', done => {
    const body = {
      customerScheduleId: scheduleId,
      reason: 'abc',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/cancelSchedule`)
      .set('apiKey', `${apikey}`)
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
