/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const StationDevicesTestFunction = require('./StationDevicesTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/StationDevicesResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let stationDeviceId = 46;
  var randomNumber = Math.floor(100000 + Math.random() * 900000);

  before(done => {
    new Promise(async function (resolve, reject) {
      let advanceUserData = await TestFunctions.loginUser();
      token = advanceUserData.token;
      resolve();
    }).then(() => done());
  });

  // =============== API /StationDevices/advanceUser/advanceUserInsertStationDevice ============

  it(`/StationDevices/advanceUser/advanceUserInsertStationDevice - Trạm thêm thiết bị thành công! (input hợp lệ) `, done => {
    const body = {
      deviceNumber: 0,
      deviceBrand: 'Device',
      purchaseYear: 0,
      liquidationYear: 0,
      originalPrice: 0,
      supplyCompany: 'Device',
      purchaseOrigin: 'Divice',
      deviceArea: 'Device',
      deviceName: 'Device',
      deviceSeri: randomNumber.toString(),
      deviceManufactureYear: 2023,
    };

    StationDevicesTestFunction.advanceUserInsertStationDevice(token, body)
      .then(res => {
        stationDeviceId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it(`/StationDevices/advanceUser/advanceUserInsertStationDevice - Trạm thêm thiết bị thất bại! (deviceSeri trùng) `, done => {
    const body = {
      deviceNumber: 0,
      deviceBrand: 'Device',
      purchaseYear: 0,
      liquidationYear: 0,
      originalPrice: 0,
      supplyCompany: 'Device',
      purchaseOrigin: 'Divice',
      deviceArea: 'Device',
      deviceName: 'Device',
      deviceSeri: randomNumber.toString(),
      deviceManufactureYear: 2023,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`API/StationDevices/advanceUser/advanceUserInsertStationDevice`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 403);
        done();
      });
  });

  // =============== /StationDevices/advanceUser/advanceUserGetListStationDevices ============

  it(`/StationDevices/advanceUser/advanceUserGetListStationDevices - Trạm lấy danh sách thiết bị thành công! (input hợp lệ ) `, done => {
    const body = {
      filter: {},
    };
    StationDevicesTestFunction.advanceUserGetListStationDevices(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`/StationDevices/advanceUser/advanceUserGetListStationDevices - Trạm lấy danh sách thiết bị thành công! (input hợp lệ ) `, done => {
    const body = {};
    StationDevicesTestFunction.advanceUserGetListStationDevices(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`/StationDevices/advanceUser/advanceUserGetListStationDevices - Trạm lấy danh sách thiết bị theo tên thành công!`, done => {
    const body = {
      filter: {},
      searchText: 'Divice',
    };
    StationDevicesTestFunction.advanceUserGetListStationDevices(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // =============== /StationDevices/advanceUser/advanceUserGetStationDeviceById ============

  it(`/StationDevices/advanceUser/advanceUserGetStationDeviceById - Trạm lấy chi tiết thiết bị thành công! (input hợp lệ ) `, done => {
    const body = {
      id: stationDeviceId,
    };
    StationDevicesTestFunction.advanceUserGetStationDeviceById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`/StationDevices/advanceUser/advanceUserGetStationDeviceById - Trạm lấy chi tiết thiết bị thất bại! (id < 0 hoặc string)) `, done => {
    const body = {
      id: -27,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/advanceUser/advanceUserGetStationDeviceById `)
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

  // =============== /StationDevices/advanceUser/advanceUserUpdateStationDeviceById ============

  it(`/StationDevices/advanceUser/advanceUserUpdateStationDeviceById - Trạm cập nhật thông tin thiết bị thành công!`, done => {
    const body = {
      id: stationDeviceId,
      data: {
        deviceName: 'okok',
      },
    };
    StationDevicesTestFunction.advanceUserUpdateStationDeviceById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`/StationDevices/advanceUser/advanceUserUpdateStationDeviceById - Trạm cập nhật thông tin thiết bị thất bại! (device của trạm khác)`, done => {
    const body = {
      id: 47,
      data: {
        deviceName: 'okok',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/advanceUser/advanceUserUpdateStationDeviceById`)
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

  it(`/StationDevices/advanceUser/advanceUserUpdateStationDeviceById - Trạm cập nhật thông tin thiết bị thất bại! (id < 0 hoặc string)`, done => {
    const body = {
      id: -46,
      data: {
        deviceName: 'okok',
        //   "deviceSeri": "12222222222",
        //   "deviceManufactureDate": "18/03/2023",
        //   "deviceStatus": "NEW"
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/advanceUser/advanceUserUpdateStationDeviceById`)
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

  // =============== /StationDevices/advanceUser/advanceUserDeleteStationDeviceById ============

  it(`/StationDevices/advanceUser/advanceUserDeleteStationDeviceById  - Trạm xóa thiết bị thành công !`, done => {
    const body = {
      id: stationDeviceId,
    };
    StationDevicesTestFunction.advanceUserDeleteStationDeviceById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`/StationDevices/advanceUser/advanceUserDeleteStationDeviceById  - Trạm xóa thiết bị thất bại! (device của trạm khác)`, done => {
    const body = {
      id: 47,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/advanceUser/advanceUserDeleteStationDeviceById`)
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

  it(`/StationDevices/advanceUser/advanceUserDeleteStationDeviceById  - Trạm xóa thiết bị thất bại! (id < 0 hoặc string)`, done => {
    const body = {
      id: -47,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDevices/advanceUser/advanceUserDeleteStationDeviceById`)
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
