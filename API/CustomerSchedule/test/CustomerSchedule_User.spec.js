/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const faker = require('faker');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
// const fs = require('fs');

// const { checkingValidPlateNumber } = require('../../ApiUtils/utilFunctions');
// const { checkUserBookingOnDayOff } = require('../../StationWorkSchedule/StationWorkScheduleFunctions');

const { SCHEDULE_STATUS, SCHEDULE_TYPE, SCHEDULE_ERROR } = require('../CustomerScheduleConstants');
// const { NORMAL_USER_ROLE } = require('../../AppUserRole/AppUserRoleConstant');
// const { BOOKING_PHONE_STATUS, APP_USER_CATEGORY } = require('../../AppUsers/AppUsersConstant');
// const { VEHICLE_TYPE } = require('../../AppUserVehicle/AppUserVehicleConstant');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/CustomerScheduleResourceAccess');
const VehicleModel = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const StationModel = require('../../Stations/resourceAccess/StationsResourceAccess');
const UserModel = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserVehicleModel = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const CustomerScheduleTestFunction = require('./CustomerScheduleTestFunctions');
const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token;
  let appUserId;

  before(done => {
    new Promise(async function (resolve, reject) {
      let customer = await TestFunctions.loginCustomerCompany();
      token = customer.token;
      appUserId = customer.appUserId;
      resolve();
    }).then(() => done());
  });

  it('Người dùng đặt lịch đăng kiểm thành công', done => {
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

    console.log(body);

    CustomerScheduleTestFunction.userCreateCustomerSchedule(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Người dùng đặt lịch thất bại (BSX không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1$$${moment().format('mmss')}`, // Sai
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

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/user/createSchedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch thất bại (dateSchedule (quá khứ) không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(-3, 'days').format('DD/MM/YYYY'), // Sai
      time: '7h-9h',
      stationsId: 36,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/user/createSchedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch thất bại (scheduleType không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: `033564${moment().format('mmss')}`,
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: moment().add(-3, 'days').format('DD/MM/YYYY'),
      time: '7h-9h',
      stationsId: 36,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
      scheduleType: 9999, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/user/createSchedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Người dùng đặt lịch thất bại (phone không hợp lệ)', done => {
    const body = {
      licensePlates: `12D1${moment().format('mmss')}`,
      phone: ``, // Sai
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

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/user/createSchedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Người dùng đặt lịch thất bại (đặt lịch vào ngày nghỉ của trạm)', done => {
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
      .post(`/CustomerSchedule/user/createSchedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch thất bại (ngày đặt hẹn sai format)', done => {
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
      .post(`/CustomerSchedule/user/createSchedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Người dùng đặt lịch thất bại (stationsId không hợp lệ)', done => {
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
      .post(`/CustomerSchedule/user/createSchedule`)
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
        stationsId: 41,
        notificationMethod: 'SMS',
        vehicleType: 1,
        licensePlateColor: 0,
        scheduleType: SCHEDULE_TYPE.VEHICLE_INSPECTION,
      };

      const cancelData = {
        customerScheduleId: null,
        reason: 'Tôi đặt nhầm thời gian / địa điểm.',
      };

      const createResponse = await CustomerScheduleTestFunction.userCreateCustomerSchedule(token, body);
      cancelData.customerScheduleId = createResponse[0];

      const secondCreateResponse = await chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerSchedule/user/createSchedule`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      checkResponseStatus(secondCreateResponse, 500);

      await CustomerScheduleTestFunction.userCancelCustomerSchedule(token, cancelData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  it('Người dùng đặt lịch không có token thì bị lỗi', done => {
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
      .post(`/CustomerSchedule/user/createSchedule`)
      // .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        checkResponseStatus(res, 401);
        done();
      });
  });

  // const body = {
  //   licensePlates: `12D1${moment().format('mmss')}`,
  //   phone: `033564${moment().format('mmss')}`,
  //   fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
  //   email: faker.internet.email(),
  //   dateSchedule: moment().add(3, 'days').format('DD/MM/YYYY'),
  //   time: '7h-9h',

  //   stationsId: 2,
  //   notificationMethod: 'SMS',
  //   vehicleType: 1,
  //   licensePlateColor: 0,
  //   scheduleType: SCHEDULE_TYPE.NEW_VEHICLE_INSPECTION,
  // };

  // it('CustomerSchedule/user/createSchedule không cho phép đặt lịch vào ngày hiện tại', done => {
  //   const testSchedule = {
  //     ...body,
  //     dateSchedule: moment().format('DD/MM/YYYY'),
  //   };
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerSchedule/user/createSchedule`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(testSchedule)
  //     .end((err, res) => {
  //       checkResponseStatus(res, 500);
  //       expect(err === SCHEDULE_ERROR.BOOKING_ON_TODAY);
  //       done();
  //     });
  // });

  //   it('Check error BLOCK_USER_BOOKING_SCHEDULE', done => {
  //     const scheduleCountByPhonePromise = Model.count({ phone: body.phone });
  //     const scheduleCountByUserIdPromise = Model.count({ appUserId: appUserId });

  //     const MAX_BOOKING_COUNT = 20;

  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         const body = res.body;
  //         if (body.statusCode === 200) {
  //           scheduleId = body.data[0];
  //         }

  //         scheduleCountByPhonePromise.then(count => {
  //           if (count >= MAX_BOOKING_COUNT) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'BLOCK_USER_BOOKING_SCHEDULE');
  //           }
  //         });

  //         scheduleCountByUserIdPromise.then(count => {
  //           if (count >= MAX_BOOKING_COUNT) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'BLOCK_USER_BOOKING_SCHEDULE');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error STATION_NOT_ACCEPT_VEHICLE', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_STATION_NOT_ACCEPT_VEHICLE(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'STATION_NOT_ACCEPT_VEHICLE');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error INVALID_STATION', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_INVALID_STATION(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'INVALID_STATION');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error INVALID_DATE', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_INVALID_DATE(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'INVALID_DATE');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error INVALID_BOOKING_CONFIG', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_INVALID_BOOKING_CONFIG(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'INVALID_BOOKING_CONFIG');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error BLOCK_BOOKING_BY_PHONE', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_BLOCK_BOOKING_BY_PHONE(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'BLOCK_BOOKING_BY_PHONE');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error MAX_LIMIT_SCHEDULE_BY_VEHICLE_COUNT', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_MAX_LIMIT_SCHEDULE_BY_VEHICLE_COUNT(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'MAX_LIMIT_SCHEDULE_BY_VEHICLE_COUNT');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error BOOKING_MAX_LIMITED_BY_CONFIG', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_BOOKING_MAX_LIMITED_BY_CONFIG(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'BOOKING_MAX_LIMITED_BY_CONFIG');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error BOOKING_MAX_LIMITED_BY_CONFIG', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_BOOKING_MAX_LIMITED_BY_CONFIG(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'BOOKING_MAX_LIMITED_BY_CONFIG');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error BOOKING_MAX_LIMITED', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_BOOKING_MAX_LIMITED(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'BOOKING_MAX_LIMITED');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error MAX_LIMIT_SCHEDULE_BY_USER', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_MAX_LIMIT_SCHEDULE_BY_USER(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'MAX_LIMIT_SCHEDULE_BY_USER');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error MAX_LIMIT_SCHEDULE_BY_PHONE', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_MAX_LIMIT_SCHEDULE_BY_PHONE(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'MAX_LIMIT_SCHEDULE_BY_PHONE');
  //           }
  //         });

  //         done();
  //       });
  //   });

  //   it('Check error MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER', done => {
  //     chai
  //       .request(`0.0.0.0:${process.env.PORT}`)
  //       .post(`/CustomerSchedule/user/createSchedule`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(body)
  //       .end((err, res) => {
  //         if (err) {
  //           console.error(err);
  //         }

  //         CheckError_MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER(body).then(error => {
  //           if (error) {
  //             checkResponseStatus(res, 500);
  //             expect(err === 'MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER');
  //           }
  //         });

  //         done();
  //       });
  //   });
  // });

  // async function CheckError_UNCONFIRMED_BOOKING_EXISTED(schedule) {
  //   const existedScheduleCount = await Model.customCount({
  //     licensePlates: schedule.licensePlates,
  //     CustomerScheduleStatus: [SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW],
  //   });
  //   return existedScheduleCount > 0;
  // }

  // function CheckError_BOOKING_ON_TODAY(schedule) {
  //   const bookingDate = moment(schedule.dateSchedule, 'DD/MM/YYYY').format('DD/MM/YYYY');
  //   const isValidScheduleDate = bookingDate && bookingDate !== 'Invalid date';
  //   return !isValidScheduleDate;
  // }

  // async function CheckError_STATION_NOT_ACCEPT_VEHICLE(schedule) {
  //   stationsData && stationsData.stationCode === '5005V' && !userVehicle.vehicleSmall;
  //   const station = await StationModel.findById(schedule.stationsId);
  //   const vehicle = await VehicleModel.find({ vehicleIdentity: schedule.licensePlates }, 0, 1);

  //   if (vehicle && station && vehicle.lenght > 0) {
  //     return station.stationCode == '5005V' && !vehicle[0].vehicleSmall;
  //   }
  // }

  // async function CheckError_INVALID_STATION(schedule) {
  //   const station = await StationModel.findById(schedule.stationsId);
  //   return !station || !station.stationsId;
  // }

  // async function CheckError_INVALID_BOOKING_CONFIG(schedule) {
  //   const station = await StationModel.findById(schedule.stationsId);
  //   if (station) {
  //     return !isNotEmptyStringValue(station.stationBookingConfig);
  //   } else {
  //     return false;
  //   }
  // }

  // async function CheckError_INVALID_DATE(schedule) {
  //   const station = await StationModel.findById(schedule.stationsId);

  //   if (station) {
  //     const stationLimitSchedule = station.limitSchedule || 30;
  //     const bookingDifferDateCount = moment(schedule.dateSchedule, 'DD/MM/YYYY').diff(moment(), 'days');
  //     if (bookingDifferDateCount > stationLimitSchedule) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  // async function CheckError_INVALID_DATE(schedule) {
  //   const station = await StationModel.findById(schedule.stationsId);

  //   if (station) {
  //     const isUserBookingOnDayOff = await checkUserBookingOnDayOff(schedule.dateSchedule, schedule.time, station.stationsId);

  //     if (isUserBookingOnDayOff) {
  //       return true;
  //     }
  //   }

  //   return false;
  // }

  // function CheckError_INVALID_PLATE_NUMBER(schedule) {
  //   return !checkingValidPlateNumber(schedule.licensePlates);
  // }

  // async function CheckError_BLOCK_BOOKING_BY_PHONE(schedule) {
  //   if (schedule.phone) {
  //     const appUsers = await UserModel.find({ phoneNumber: schedule.phone }, 0, 1);
  //     if (appUsers && appUsers.length > 0) {
  //       const appUser = appUsers[0];
  //       const isBlockedUser = appUser.appUserRoleId === NORMAL_USER_ROLE && appUser.enableBookingStatus === BOOKING_PHONE_STATUS.BLOCK;
  //       return isBlockedUser;
  //     }
  //   }
  // }

  // async function CheckError_MAX_LIMIT_SCHEDULE_BY_VEHICLE_COUNT(schedule) {
  //   if (schedule.phone) {
  //     const appUsers = await UserModel.find({ phoneNumber: schedule.phone }, 0, 1);
  //     if (appUsers && appUsers.length > 0) {
  //       const appUser = appUsers[0];

  //       if (appUser.appUserRoleId === NORMAL_USER_ROLE && appUser.appUserCategory === APP_USER_CATEGORY.PERSONAL_ACCOUNT) {
  //         const userVehicleCount = await AppUserVehicleModel.count({ appUserId: appUser.appUserId });

  //         const userScheduleCount = await Model.customCount({
  //           appUserId: appUser.appUserId,
  //           CustomerScheduleStatus: [SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW],
  //         });

  //         return userScheduleCount > 0 && userVehicleCount > 0 && userScheduleCount >= userVehicleCount;
  //       }
  //     }
  //   }
  // }

  // async function CheckError_BOOKING_MAX_LIMITED_BY_CONFIG(schedule) {
  //   const station = await StationModel.findById(schedule.stationsId);

  //   if (station && station.stationBookingConfig) {
  //     const _stationBookingConfig = station.stationBookingConfig;

  //     let _bookingLimit = _getBookingLimitFromConfig(schedule.time, _stationBookingConfig, schedule.vehicleType);

  //     return _bookingLimit === 0;
  //   }
  // }

  // async function CheckError_BOOKING_MAX_LIMITED(schedule) {
  //   const station = await StationModel.findById(schedule.stationsId);

  //   if (station && station.stationBookingConfig) {
  //     const _stationBookingConfig = station.stationBookingConfig;

  //     let _bookingLimit = _getBookingLimitFromConfig(schedule.time, _stationBookingConfig, schedule.vehicleType);

  //     const _currentBookingCount = Model.customSearch(
  //       {
  //         time: schedule.time,
  //         dateSchedule: schedule.dateSchedule,
  //         CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
  //         vehicleType: schedule.vehicleType,
  //         stationsId: schedule.stationsId,
  //       },
  //       0,
  //       _bookingLimit + 1,
  //     );

  //     return _currentBookingCount >= 0 && _bookingLimit > 0 && _bookingLimit <= _currentBookingCount;
  //   }
  // }

  // async function CheckError_MAX_LIMIT_SCHEDULE_BY_USER(schedule) {
  //   if (schedule.phone) {
  //     const appUsers = await UserModel.find({ phoneNumber: schedule.phone }, 0, 1);
  //     if (appUsers && appUsers.length > 0) {
  //       const _appUser = appUsers[0];

  //       if (_appUser && _appUser.appUserCategory !== APP_USER_CATEGORY.COMPANY_ACCOUNT && _appUser.appUserRoleId <= NORMAL_USER_ROLE) {
  //         const scheduleCountByUserId = await Model.customCount({ appUserId: appUsers.appUserId });

  //         const LIMIT_SCHEDULE_BY_USER = 10;
  //         return scheduleCountByUserId >= LIMIT_SCHEDULE_BY_USER;
  //       }
  //     }
  //   }
  // }

  // async function CheckError_MAX_LIMIT_SCHEDULE_BY_PHONE(schedule) {
  //   if (schedule.phone) {
  //     const appUsers = await UserModel.find({ phoneNumber: schedule.phone }, 0, 1);
  //     if (appUsers && appUsers.length > 0) {
  //       const _appUser = appUsers[0];

  //       if (_appUser && _appUser.appUserCategory !== APP_USER_CATEGORY.COMPANY_ACCOUNT && _appUser.appUserRoleId <= NORMAL_USER_ROLE) {
  //         if (schedule.phone) {
  //           const LIMIT_SCHEDULE_BY_PHONE = 10;
  //           const scheduleCountByPhoneNumber = await Model.count({ phone: phoneNumber });

  //           return scheduleCountByPhoneNumber >= LIMIT_SCHEDULE_BY_PHONE;
  //         }
  //       }
  //     }
  //   }
  // }

  // async function CheckError_MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER(schedule) {
  //   // 1 biển số xe không được đặt 5 lần
  //   const scheduleCountByPlateNumber = (await Model.count({ licensePlates: schedule.licensePlates })) || 0;

  //   const MAX_LIMIT_PLATE_NUMBER_BOOKING_PER_YEAR = 5;

  //   return scheduleCountByPlateNumber >= MAX_LIMIT_PLATE_NUMBER_BOOKING_PER_YEAR;
  // }

  // function _getBookingLimitFromConfig(hourRange, bookingConfig, vehicleType) {
  //   let _limit = 0;

  //   if (!vehicleType) {
  //     vehicleType = VEHICLE_TYPE.OTHER;
  //   }
  //   for (let i = 0; i < bookingConfig.length; i++) {
  //     const _config = bookingConfig[i];
  //     if (_config.time === hourRange && _config.enableBooking) {
  //       _limit = getLimitVehicleByType(vehicleType, _config);
  //     }
  //   }
  //   return _limit;
  // }

  // function getLimitVehicleByType(vehicleType, config) {
  //   let _scheduleLimit = 0;
  //   switch (vehicleType) {
  //     case VEHICLE_TYPE.CAR:
  //       _scheduleLimit = config.limitSmallCar || 0;
  //       break;
  //     case VEHICLE_TYPE.RO_MOOC:
  //       if (config.limitRoMooc) {
  //         _scheduleLimit = config.limitRoMooc || 0;
  //       }
  //       break;
  //     case VEHICLE_TYPE.OTHER:
  //       _scheduleLimit = config.limitOtherVehicle || 0;
  //       break;
  //   }
  //   return _scheduleLimit;
});
