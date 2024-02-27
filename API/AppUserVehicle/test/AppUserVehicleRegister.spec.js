/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const moment = require('moment');
const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const { VEHICLE_PLATE_TYPE } = require('../AppUserVehicleConstant');
const { deleteVehicle } = require('./AppUserVehicleTestFunction');

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

  it('Register vehicle - user đăng ký thành công ((Xe tải dưới 3 tấn - nhập vehicleTotalWeight hợp lệ)', done => {
    const body = {
      vehicleIdentity: '12A' + faker.datatype.number({ min: 10000, max: 99999 }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleExpiryDate: moment(faker.date.future()).format('DD/MM/YYYY'),
      vehicleSubType: 12,
      vehicleBrandName: faker.name.findName(),
      vehicleBrandModel: faker.random.alpha(10),
      certificateSeries: '-',
      vehicleWeight: 1000,
      vehicleSubCategory: 2004,
      vehicleGoodsWeight: 1999,
      vehicleTotalWeight: 2500,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        } else {
          vehicleId = res.body.data.appUserVehicleId;
          chai.expect(res.body.data.vehicleTotalWeight).to.equal(2500);
          checkResponseStatus(res, 200);
          done();
        }
      });
  });

  it('Get list vehicle - user lấy danh sách phương tiện thành công', done => {
    const body = {
      limit: 5,
      skip: 0,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/getList`)
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

  it('Get detail vehicle - user lấy thông tin chi tiết phương tiện thành công', done => {
    const body = {
      id: vehicleId,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/getDetail`)
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

  it('Register vehicle -  user đăng ký thành công (Xe tải dưới 3 tấn - nhập vehicleTotalWeight > 3 tấn => vehicleTotalWeight set lại = 2999 ) ', done => {
    const body = {
      vehicleIdentity: '12A' + faker.datatype.number({ min: 10000, max: 99999 }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleExpiryDate: moment(faker.date.future()).format('DD/MM/YYYY'),
      vehicleSubType: 12,
      vehicleBrandName: faker.name.findName(),
      vehicleBrandModel: faker.random.alpha(10),
      certificateSeries: '-',
      vehicleWeight: 1000,
      vehicleSubCategory: 2004,
      vehicleGoodsWeight: 1999,
      vehicleTotalWeight: 3999,
    };

    let vehicleId1;

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        } else {
          chai.expect(res.body.data.vehicleTotalWeight).to.equal(2999);
          vehicleId1 = res.body.data.appUserVehicleId;
          checkResponseStatus(res, 200);

          // Xóa phương tiện vừa đăng kí đề phòng trường hợp gọi unittest nhiều lần
          //=> số lượng phương tiện vượt quá quy định
          //=> unittest không hoạt động đúng
          deleteVehicle(token, vehicleId1, done);
        }
      });
  });

  it('Register vehicle -  user đăng ký thành công (Xe tải dưới 3 tấn - nhập vehicleTotalWeight < min:2000  => vehicleTotalWeight set lại = 2000 ) ', done => {
    let vehicleId2;
    const body = {
      vehicleIdentity: '12A' + faker.datatype.number({ min: 10000, max: 99999 }),
      vehiclePlateColor: faker.random.arrayElement([
        VEHICLE_PLATE_TYPE.BLUE,
        VEHICLE_PLATE_TYPE.RED,
        VEHICLE_PLATE_TYPE.WHITE,
        VEHICLE_PLATE_TYPE.YELLOW,
      ]),
      vehicleExpiryDate: moment(faker.date.future()).format('DD/MM/YYYY'),
      vehicleSubType: 12,
      vehicleBrandName: faker.name.findName(),
      vehicleBrandModel: faker.random.alpha(10),
      certificateSeries: '-',
      vehicleWeight: 1000,
      vehicleSubCategory: 2004,
      vehicleGoodsWeight: 1999,
      vehicleTotalWeight: 1500,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/registerVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        } else {
          chai.expect(res.body.data.vehicleTotalWeight).to.equal(2000);
          vehicleId2 = res.body.data.appUserVehicleId;
          checkResponseStatus(res, 200);

          // Xóa phương tiện vừa đăng kí đề phòng trường hợp gọi unittest nhiều lần
          //=> số lượng phương tiện vượt quá quy định
          //=> unittest không hoạt động đúng
          deleteVehicle(token, vehicleId2, done);
        }
      });
  });

  it('Update vehicle - user cập nhật thành công (Xe tải dưới 3 tấn - nhập vehicleTotalWeight > 3 tấn => vehicleTotalWeight set lại = 2999 )', done => {
    const body = {
      id: vehicleId,
      data: {
        vehicleWeight: 1000,
        vehicleSubCategory: 2004,
        vehicleGoodsWeight: 1999,
        vehicleTotalWeight: 3999,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/updateVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        } else {
          chai.expect(res.body.data.vehicleTotalWeight).to.equal(2999);
          checkResponseStatus(res, 200);
          done();
        }
      });
  });

  it('Update vehicle - user cập nhật thành công(Xe tải dưới 3 tấn - nhập vehicleTotalWeight < min:2000  => vehicleTotalWeight set lại = 2000 ) ', done => {
    const body = {
      id: vehicleId,
      data: {
        vehicleWeight: 1000,
        vehicleSubCategory: 2004,
        vehicleGoodsWeight: 1999,
        vehicleTotalWeight: 1500,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/updateVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        } else {
          chai.expect(res.body.data.vehicleTotalWeight).to.equal(2000);
          checkResponseStatus(res, 200);
          done();
        }
      });
  });

  it('Update vehicle - user cập nhật thành công (Xe tải dưới 4 tấn - nhập vehicleTotalWeight hợp lệ )', done => {
    const body = {
      id: vehicleId,
      data: {
        vehicleWeight: 1000,
        vehicleSubCategory: 2005,
        vehicleTotalWeight: 3500,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserVehicle/user/updateVehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        } else {
          chai.expect(res.body.data.vehicleTotalWeight).to.equal(3500);
          checkResponseStatus(res, 200);
          done();
        }
      });
  });

  it('Delete vehicle )', done => {
    // Xóa phương tiện vừa đăng kí đề phòng trường hợp gọi unittest nhiều lần
    //=> số lượng phương tiện vượt quá quy định
    //=> unittest không hoạt động đúng
    deleteVehicle(token, vehicleId, done);
  });
});
