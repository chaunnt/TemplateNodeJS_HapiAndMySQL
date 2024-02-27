/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const faker = require('faker');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

const { SCHEDULE_STATUS, SCHEDULE_TYPE, SCHEDULE_ERROR } = require('../CustomerScheduleConstants');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const CustomerScheduleTestFunction = require('./CustomerScheduleTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/CustomerScheduleResourceAccess');
const VehicleModel = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const StationModel = require('../../Stations/resourceAccess/StationsResourceAccess');
const UserModel = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserVehicleModel = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token;
  let appUserId;
  let advanceUserToken;
  let stationId;

  before(done => {
    new Promise(async function (resolve, reject) {
      let customer = await TestFunctions.loginCustomerCompany();
      let advanceUser = await TestFunctions.loginUser();
      stationId = advanceUser.stationsId;
      token = customer.token;
      advanceUserToken = advanceUser.token;
      appUserId = customer.appUserId;
      resolve();
    }).then(() => done());
  });

  // ============================ Nhân viên đặt lịch ==============================
  it('Nhân viên đặt lịch đăng kiểm thành công', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: stationId,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    CustomerScheduleTestFunction.advanceUserCreateCustomerSchedule(advanceUserToken, body)
      .then(res => {
        const cancelData = {
          customerScheduleId: res.customerScheduleId,
          reason: 'Sai thông tin phương tiện',
        };
        CustomerScheduleTestFunction.advanceUserCancelCustomerSchedule(advanceUserToken, cancelData);
        done();
      })
      .catch(error => done(error));
  });

  it('Nhân viên đặt lịch thất bại (BSX không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1$$${moment().format('mmss')}`, // Sai
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: stationId,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      .set('Authorization', `Bearer ${advanceUserToken}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên đặt lịch thất bại (dateSchedule (quá khứ) không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(-3, 'days').format('DD/MM/YYYY'), // Sai
      time: '7h-9h',
      stationsId: stationId,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      .set('Authorization', `Bearer ${advanceUserToken}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên đặt lịch thất bại (scheduleType không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(-3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: stationId,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: 9999, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      .set('Authorization', `Bearer ${advanceUserToken}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Nhân viên đặt lịch thất bại (phone không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: ``, // Sai
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: stationId,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      .set('Authorization', `Bearer ${advanceUserToken}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 400);
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
      stationsId: stationId,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      .set('Authorization', `Bearer ${advanceUserToken}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên đặt lịch thất bại (ngày đặt hẹn sai format)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('YYYYMMDD'),
      time: '7h-9h',
      stationsId: 41,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      .set('Authorization', `Bearer ${advanceUserToken}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên đặt lịch thất bại (stationsId không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: 99999,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      .set('Authorization', `Bearer ${token}`)
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
        phone: `033564${moment().format('mmss')}`,
        fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
        email: faker.internet.email(),
        dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
        time: '7h-9h',
        notificationMethod: 'SMS',
        vehicleType: 1,
        licensePlateColor: 0,
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      };

      const cancelData = {
        customerScheduleId: null,
        reason: 'Sai thông tin phương tiện',
      };

      const createResponse = await CustomerScheduleTestFunction.advanceUserCreateCustomerSchedule(advanceUserToken, body);
      cancelData.customerScheduleId = createResponse.customerScheduleId;

      const secondCreateResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerSchedule/advanceUser/insertSchedule`)
        .set('Authorization', `Bearer ${advanceUserToken}`)
        .send(body);

      checkResponseStatus(secondCreateResponse, 500);

      await CustomerScheduleTestFunction.advanceUserCancelCustomerSchedule(advanceUserToken, cancelData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it('Nhan viên đặt lịch không có token thì bị lỗi', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
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
      .post(`/CustomerSchedule/advanceUser/insertSchedule`)
      // .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 401);
        done();
      });
  });

  it('Nhân viên lấy danh sách lịch hẹn thành công', async () => {
    try {
      const body = {
        filter: {
          CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
        },
        startDate: moment().format('DD/MM/YYYY'),
        endDate: moment().add(3, 'days').format('DD/MM/YYYY'),
        limit: 20,
        order: {
          key: 'customerScheduleId',
          value: 'desc',
        },
      };

      await CustomerScheduleTestFunction.advanceUserGetListCustomerSchedule(advanceUserToken, body);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it('Nhân viên tìm kiếm lịch hẹn theo BSX thành công (BSX hợp lệ)', async () => {
    try {
      const body = {
        licensePlates: `12D1${moment().format('mmss')}`,
        phone: `033564${moment().format('mmss')}`,
        fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
        email: faker.internet.email(),
        dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
        time: '7h-9h',
        stationsId: 36,
        notificationMethod: 'SMS',
        vehicleType: 1,
        licensePlateColor: 0,
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      };

      const cancelData = {
        customerScheduleId: null,
        reason: 'Tôi đặt nhầm thời gian / địa điểm.',
      };

      const bodyFind = {
        filter: {
          CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
        },
        startDate: moment().format('DD/MM/YYYY'),
        endDate: moment().add(15, 'days').format('DD/MM/YYYY'),
        limit: 20,
        searchText: body.licensePlates,
        order: {
          key: 'customerScheduleId',
          value: 'desc',
        },
      };

      const createResponse = await CustomerScheduleTestFunction.userCreateCustomerSchedule(token, body);
      cancelData.customerScheduleId = createResponse[0];

      const cancelResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerSchedule/advanceUser/list`)
        .set('Authorization', `Bearer ${advanceUserToken}`)
        .send(bodyFind);

      if (cancelResponse.body.data.data.length > 0) {
        checkResponseStatus(cancelResponse, 200);
      } else {
        throw new Error('ERROR');
      }

      await CustomerScheduleTestFunction.userCancelCustomerSchedule(token, cancelData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it('Nhân viên tìm kiếm lịch hẹn theo BSX thành công (BSX có ký tự thường)', async () => {
    try {
      const body = {
        licensePlates: `12D1${moment().format('mmss')}`,
        phone: `033564${moment().format('mmss')}`,
        fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
        email: faker.internet.email(),
        dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
        time: '7h-9h',
        stationsId: 36,
        notificationMethod: 'SMS',
        vehicleType: 1,
        licensePlateColor: 0,
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      };

      const cancelData = {
        customerScheduleId: null,
        reason: 'Tôi đặt nhầm thời gian / địa điểm.',
      };

      const bodyFind = {
        filter: {
          CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
        },
        startDate: moment().format('DD/MM/YYYY'),
        endDate: moment().add(15, 'days').format('DD/MM/YYYY'),
        limit: 20,
        searchText: body.licensePlates.toLocaleLowerCase(),
        order: {
          key: 'customerScheduleId',
          value: 'desc',
        },
      };

      const createResponse = await CustomerScheduleTestFunction.userCreateCustomerSchedule(token, body);
      cancelData.customerScheduleId = createResponse[0];

      const cancelResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerSchedule/advanceUser/list`)
        .set('Authorization', `Bearer ${advanceUserToken}`)
        .send(bodyFind);

      if (cancelResponse.body.data.data.length > 0) {
        checkResponseStatus(cancelResponse, 200);
      } else {
        throw new Error('ERROR');
      }

      await CustomerScheduleTestFunction.userCancelCustomerSchedule(token, cancelData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it('Nhân viên lấy tra cứu lịch hẹn thành công', async () => {
    try {
      const body = {
        filter: {
          CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
        },
        limit: 4,
        order: {
          key: 'createdAt',
          value: 'desc',
        },
      };

      await CustomerScheduleTestFunction.advanceUserSearchCustomerSchedule(advanceUserToken, body);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it('Nhân viên tra cứu lịch hẹn theo BSX thành công (BSX hợp lệ)', async () => {
    try {
      const body = {
        licensePlates: `12D1${moment().format('mmss')}`,
        phone: `033564${moment().format('mmss')}`,
        fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
        email: faker.internet.email(),
        dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
        time: '7h-9h',
        stationsId: 36,
        notificationMethod: 'SMS',
        vehicleType: 1,
        licensePlateColor: 0,
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      };

      const cancelData = {
        customerScheduleId: null,
        reason: 'Tôi đặt nhầm thời gian / địa điểm.',
      };

      const bodyFind = {
        filter: {
          CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
        },
        limit: 4,
        searchText: body.licensePlates,
        order: {
          key: 'createdAt',
          value: 'desc',
        },
      };

      const createResponse = await CustomerScheduleTestFunction.userCreateCustomerSchedule(token, body);
      cancelData.customerScheduleId = createResponse[0];

      const cancelResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerSchedule/advanceUser/searchSchedule`)
        .set('Authorization', `Bearer ${advanceUserToken}`)
        .send(bodyFind);

      if (cancelResponse.body.data.data.length > 0) {
        checkResponseStatus(cancelResponse, 200);
      } else {
        throw new Error('ERROR');
      }

      await CustomerScheduleTestFunction.userCancelCustomerSchedule(token, cancelData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it('Nhân viên tra cứu lịch hẹn theo BSX thành công (BSX có ký tụ thường', async () => {
    try {
      const body = {
        licensePlates: `12D1${moment().format('mmss')}`,
        phone: `033564${moment().format('mmss')}`,
        fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
        email: faker.internet.email(),
        dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
        time: '7h-9h',
        stationsId: 36,
        notificationMethod: 'SMS',
        vehicleType: 1,
        licensePlateColor: 0,
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      };

      const cancelData = {
        customerScheduleId: null,
        reason: 'Tôi đặt nhầm thời gian / địa điểm.',
      };

      const bodyFind = {
        filter: {
          CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
        },
        limit: 4,
        searchText: body.licensePlates.toLocaleLowerCase(),
        order: {
          key: 'createdAt',
          value: 'desc',
        },
      };

      const createResponse = await CustomerScheduleTestFunction.userCreateCustomerSchedule(token, body);
      cancelData.customerScheduleId = createResponse[0];

      const cancelResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerSchedule/advanceUser/searchSchedule`)
        .set('Authorization', `Bearer ${advanceUserToken}`)
        .send(bodyFind);

      if (cancelResponse.body.data.data.length > 0) {
        checkResponseStatus(cancelResponse, 200);
      } else {
        throw new Error('ERROR');
      }

      await CustomerScheduleTestFunction.userCancelCustomerSchedule(token, cancelData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});
