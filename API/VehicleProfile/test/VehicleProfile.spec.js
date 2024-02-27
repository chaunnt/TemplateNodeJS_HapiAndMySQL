/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const moment = require('moment');
const expect = chai.expect;

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/VehicleProfileResourceAccess');

const app = require('../../../server');
const { VEHICLE_PLATE_TYPE, VEHICLE_TYPE, USER_VEHICLE_ERROR } = require('../../AppUserVehicle/AppUserVehicleConstant');

describe(`Tests ${Model.modelName}`, function () {
  let vehicleProfileId;
  let token = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let userData = await TestFunctions.loginUser();
      token = userData.token;
      resolve();
    }).then(() => done());
  });

  const body = {
    vehiclePlateNumber:
      '12A' +
      faker.datatype.number({
        min: 10000,
        max: 99999,
      }),
    vehiclePlateColor: faker.random.arrayElement(Object.values(VEHICLE_PLATE_TYPE)),
    engineNumber: faker.random.alpha({ count: 12, casing: 'upper' }),
    chassisNumber: faker.random.alpha({ count: 12, casing: 'upper' }),
    vehicleRegistrationCode: faker.random.alpha(10),
    vehicleType: faker.random.arrayElement(Object.values(VEHICLE_TYPE)),
    vehicleBrandName: faker.name.findName(),
    vehicleBrandModel: faker.random.alpha(10),
    vehicleRegistrationImageUrl: faker.image.abstract(),
    vehicleExpiryDate: moment(faker.date.future()).format('DD/MM/YYYY'),
    certificateSeries:
      faker.random.alpha(2).toUpperCase() +
      '-' +
      faker.datatype.number({
        min: 1000000,
        max: 9999999,
      }),
    fileList: [
      {
        vehicleFileName: faker.name.findName(),
        vehicleFileUrl: faker.image.abstract(),
        vehicleFileType: 1,
      },
    ],
  };

  it('Nhân viên trung tâmr đăng ký hồ sơ thành công !', done => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        vehicleProfileId = res.body.data[0];
        done();
      });
  });

  it('Nhân viên trung tâmr đăng ký hồ sơ biển số xe không hợp lệ !', done => {
    const thisBody = { ...body, vehiclePlateNumber: '1212322' };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(err === USER_VEHICLE_ERROR.INVALID_PLATE_NUMBER);
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên trung tâmr đăng ký hồ sơ số seri không hợp lệ !', done => {
    const thisBody = { ...body, certificateSeries: '1212322' };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(err === USER_VEHICLE_ERROR.INVALID_PLATE_NUMBER);
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên trung tâmr đăng ký loại phương tiện không hợp lệ !', done => {
    const thisBody = { ...body, vehicleType: '1212322' };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Nhân viên trung tâmr đăng ký hồ sơ phương tiện hạn đăng kiểm không hợp lệ !', done => {
    const thisBody = { ...body, vehicleExpiryDate: '1212322' };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Nhân viên trung tâmr update hồ sơ thành công!', done => {
    const thisBody = {
      id: vehicleProfileId,
      data: {
        engineNumber: faker.random.alpha({ count: 12, casing: 'upper' }),
        fileList: [
          {
            vehicleFileName: faker.name.findName(),
            vehicleFileUrl: faker.image.abstract(),
          },
          {
            vehicleFileName: faker.name.findName(),
            vehicleFileUrl: faker.image.abstract(),
          },
          {
            vehicleFileName: faker.name.findName(),
            vehicleFileUrl: faker.image.abstract(),
          },
        ],
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/updateById`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Test advance cập nhật hồ sơ thất bại!', done => {
    const thisBody = {
      id: vehicleProfileId,
      data: {
        engineNumber: -1000,
        fileList: [
          {
            vehicleFileName: faker.name.findName(),
          },
        ],
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/updateById`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Nhân viên trung tâm get detail hồ sơ', done => {
    const thisBody = {
      id: vehicleProfileId,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/findById`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Nhân viên trung tâm xem danh sách hồ sơ', done => {
    const thisBody = {};

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/find`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Nhân viên trung tâm tra cứu hồ sơ', done => {
    const thisBody = {};

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/search`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Test advance xóa hồ sơ phương tiện!', done => {
    const thisBody = {
      id: vehicleProfileId,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/VehicleProfile/advanceUser/deleteById`)
      .set('Authorization', `Bearer ${token}`)
      .send(thisBody)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
});
