/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const StationDevicesTestFunction = require('./StationDevicesTestFunction');
const { STATION_DEVICES_STATUS } = require('../StationDevicesConstants');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/StationDevicesResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let stationDeviceId = 46;
  var randomNumber = Math.floor(100000 + Math.random() * 900000);
  let randomString = faker.name.firstName() + faker.name.lastName();
  randomString = randomString.replace("'", '');

  before(done => {
    new Promise(async function (resolve, reject) {
      let advanceUserData = await TestFunctions.loginStaff();
      token = advanceUserData.token;
      resolve();
    }).then(() => done());
  });

  // =============== /StationDevices/insert ============

  it(`Admin thêm thiết bị thành công! (input hợp lệ) `, done => {
    const body = {
      deviceName: randomString,
      stationsId: 36,
      deviceBrand: randomString,
      deviceManufactureYear: '2019',
      deviceType: '1',
      deviceSeri: randomNumber.toString(),
      deviceStatus: STATION_DEVICES_STATUS.ACTIVE,
      deviceTestedDate: '02/12/2023',
      deviceExpiredTestedDate: '09/12/2023',
    };

    StationDevicesTestFunction.adminInsertStationDevice(token, body)
      .then(res => {
        stationDeviceId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin thêm thiết bị thất bại! (deviceSeri trùng) `, done => {
    const body = {
      deviceName: randomString,
      stationsId: 36,
      deviceBrand: randomString,
      deviceManufactureYear: '2019',
      deviceType: '1',
      deviceSeri: randomNumber.toString(),
      deviceStatus: STATION_DEVICES_STATUS.ACTIVE,
      deviceTestedDate: '02/12/2023',
      deviceExpiredTestedDate: '09/12/2023',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/insert`)
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

  // =============== /StationDevices/find ============

  it(`Admin lấy danh sách thiết bị của trạm thành công! (input hợp lệ ) `, done => {
    const body = {
      filter: {
        stationsId: 36,
      },
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    StationDevicesTestFunction.adminGetListStationDevice(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin lấy danh sách thiết bị của trạm thành công! (input hợp lệ ) `, done => {
    const body = {};
    StationDevicesTestFunction.adminGetListStationDevice(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin lấy danh sách thiết bị của trạm thành công!`, done => {
    const body = {
      filter: {},
      searchText: randomString,
    };
    StationDevicesTestFunction.adminGetListStationDevice(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // =============== /StationDevices/findById ============

  it(`Admin lấy chi tiết thiết bị thành công! (input hợp lệ ) `, done => {
    const body = {
      id: stationDeviceId,
    };
    StationDevicesTestFunction.adminGetDetailStationDevice(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin lấy chi tiết thiết bị thất bại! (id < 0 hoặc string)) `, done => {
    const body = {
      id: -27,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/findById`)
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

  // =============== /StationDevices/updateById ============

  it(`Admin cập nhật thông tin thiết bị thành công!`, done => {
    const body = {
      id: stationDeviceId,
      data: {
        deviceName: 'okok',
      },
    };
    StationDevicesTestFunction.adminUpdateStationDeviceById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin cập nhật thông tin thiết bị thất bại! (id < 0 hoặc string)`, done => {
    const body = {
      id: -46,
      data: {
        deviceName: 'okok',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/updateById`)
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

  it(`Admin cập nhật thông tin thiết bị thất bại! (deviceSeri trùng)`, done => {
    const body = {
      id: 46,
      data: {
        deviceSeri: randomNumber.toString(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/updateById`)
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

  // =============== /StationDevices/deleteById ============

  it(`Admin xóa thiết bị thành công !`, done => {
    const body = {
      id: stationDeviceId,
    };
    StationDevicesTestFunction.adminDeleteStationDeviceById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin xóa thiết bị thất bại! (id < 0 hoặc string)`, done => {
    const body = {
      id: -47,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/deleteById`)
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
