/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationNewsResourceAccess');

const { modelName } = require('../resourceAccess/StationNewsResourceAccess');
const StationNewsTestFunction = require('./StationNewsTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let stationNewsId;
  let token = '';
  let fakeUserName = faker.name.firstName() + faker.name.lastName();
  fakeUserName = fakeUserName.replace("'", '');

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginCustomer();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('User lấy tin tức trạm thành công', done => {
    const body = {
      skip: 0,
      limit: 10,
      stationsUrl: 'dev320-web.captain.ttdk.com.vn',
      filter: {
        stationNewsCategories: '2',
      },
      order: {
        key: 'ordinalNumber',
        value: 'asc',
      },
    };
    StationNewsTestFunction.userGetListStationNews(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('User lấy tin tức thất bại (stationsUrl: sai)', done => {
    const body = {
      skip: 0,
      limit: 10,
      stationsUrl: 'dev320-web.captain.ttdk.com.vn',
      filter: {
        stationNewsCategories: 'aaaaaaaaa', // Sai
      },
      order: {
        key: 'ordinalNumber',
        value: 'asc',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/user/getNewestList`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('User chia sẻ tin tức thành công', done => {
    let stationNewsId = null;
    const body = {
      stationNewsId: 3,
    };
    const bodyGet = {
      skip: 0,
      limit: 10,
      stationsUrl: 'dev320-web.captain.ttdk.com.vn',
      filter: {
        stationNewsCategories: '2',
      },
    };

    // Lấy id tin tức trong db để đảm bảo luôn có id đúng
    StationNewsTestFunction.userGetListStationNews(token, bodyGet).then(res => {
      stationNewsId = res[0].stationNewsId;
    });

    StationNewsTestFunction.usershareStationNews(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('User chia sẻ tin tức thất bại (input không hợp lệ)', done => {
    const body = {
      stationNewsId: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/user/increaseShare`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('User lấy tin tức  "Chuyên gia chia sẻ" thành công', done => {
    const body = {
      skip: 0,
      limit: 10,
      order: {
        key: 'ordinalNumber',
        value: 'asc',
      },
    };
    StationNewsTestFunction.userGetListExpertNews(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });
});
