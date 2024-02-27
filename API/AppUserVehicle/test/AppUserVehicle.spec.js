/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const moment = require('moment');
const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const { VEHICLE_PLATE_TYPE, VEHICLE_TYPE } = require('../AppUserVehicleConstant');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/AppUserVehicleResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let vehicleId;
  let token = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let userData = await TestFunctions.loginCustomer();
      token = userData.token;
      resolve();
    }).then(() => done());
  });

  it('User register vehicle', done => {
    const body = {
      vehicleIdentity:
        '12A' +
        faker.datatype.number({
          min: 10000,
          max: 99999,
        }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleRegistrationCode: faker.random.alpha(10),
      vehicleType: faker.random.arrayElement([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]),
      vehicleBrandName: faker.name.findName(),
      vehicleBrandModel: faker.random.alpha(10),
      vehicleRegistrationImageUrl: faker.image.abstract(),
      vehicleExpiryDate: moment(faker.date.future()).format('DD/MM/YYYY'),
      // certificateSeries: faker.random.alpha(2).toUpperCase() + '-' + faker.datatype.number({
      //     'min': 1000000,
      //     'max': 9999999
      // }),
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        vehicleId = res.body.data[0];
        done();
      });
  });
  it('User register vehicle', done => {
    const body = {
      vehicleIdentity:
        '12XG' +
        faker.datatype.number({
          min: 10000,
          max: 99999,
        }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleRegistrationCode: faker.random.alpha(10),
      vehicleType: faker.random.arrayElement([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]),
      vehicleBrandName: faker.name.findName(),
      vehicleBrandModel: faker.random.alpha(10),
      vehicleRegistrationImageUrl: faker.image.abstract(),
      certificateSeries: '-',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
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
  it('User register vehicle', done => {
    const body = {
      vehicleIdentity:
        '12A' +
        faker.datatype.number({
          min: 10000,
          max: 99999,
        }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleRegistrationCode: faker.random.alpha(10),
      vehicleType: faker.random.arrayElement([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]),
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
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
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
  it('User register vehicle', done => {
    const body = {
      vehicleIdentity:
        '12A' +
        faker.datatype.number({
          min: 10000,
          max: 99999,
        }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleRegistrationCode: faker.random.alpha(10),
      vehicleType: faker.random.arrayElement([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]),
      vehicleBrandName: faker.name.findName(),
      vehicleBrandModel: faker.random.alpha(10),
      vehicleRegistrationImageUrl: faker.image.abstract(),
      certificateSeries:
        faker.random.alpha(2).toUpperCase() +
        '-' +
        faker.datatype.number({
          min: 1000000,
          max: 9999999,
        }),
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
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
  it('User register vehicle', done => {
    const body = {
      vehicleIdentity:
        '39R' +
        faker.datatype.number({
          min: 10000,
          max: 99999,
        }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleRegistrationCode: faker.random.alpha(10),
      vehicleType: faker.random.arrayElement([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER]),
      vehicleBrandName: faker.name.findName(),
      vehicleBrandModel: faker.random.alpha(10),
      vehicleRegistrationImageUrl: faker.image.abstract(),
      certificateSeries: '-',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
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

  it('User update vehicle', done => {
    const body = {
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleExpiryDate: moment(faker.date.future()).format('DD/MM/YYYY'),
      vehicleRegistrationImageUrl: faker.image.abstract(),
      vehicleVerifiedInfo: faker.random.arrayElement([1, 0]),
      extendLicenseUrl: faker.image.abstract(),
      vehicleVerifiedInfo: faker.random.arrayElement([1, 0]),
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/updateVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: vehicleId,
        data: body,
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('User delete Vehicle', done => {
    const body = {
      id: vehicleId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/deleteVehicle`)
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
});
