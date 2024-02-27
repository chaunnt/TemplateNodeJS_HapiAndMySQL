/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const AppSharingTestFunction = require('./AppSharingTestFunction');
const StationNewsTestFunction = require('../../StationNews/test/StationNewsTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const app = require('../../../server');

describe(`Tạo link share`, function () {
  let token = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let advanceUserData = await TestFunctions.loginCustomer();
      token = advanceUserData.token;
      resolve();
    }).then(() => done());
  });

  // =============== /AppSharing/StationNews/{stationNewsId} ============

  it(`Tạo link share tin tức thành công!`, done => {
    let stationNewsId = null;

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
        stationNewsId = res.data[0].stationNewsId;

        AppSharingTestFunction.createShareLinkStaionNews(token, stationNewsId)
          .then(() => done())
          .catch(error => done(error));
      })
      .catch(error => done(error));
  });

  it(`Tạo link share tin tức thất bại!`, done => {
    let stationNewsId = -1;

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .get(`/AppSharing/StationNews/${stationNewsId}`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  // =============== /AppSharing/Stations/{stationCode} ============

  it(`Tạo link share trung tâm thành công!`, done => {
    let stationCode = '2004D';

    AppSharingTestFunction.createShareLinkStaions(token, stationCode)
      .then(() => done())
      .catch(error => done(error));
  });
});
