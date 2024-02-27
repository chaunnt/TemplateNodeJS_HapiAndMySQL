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
      let staffData = await TestFunctions.loginStaff();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('Admin tạo mới tin tức thành công', done => {
    const body = {
      stationNewsTitle: fakeUserName,
      stationNewsContent: fakeUserName,
      stationNewsAvatar: fakeUserName,
    };

    StationNewsTestFunction.adminInsertStationNews(token, body)
      .then(res => {
        stationNewsId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Admin tạo mới tin tức thất bại (input không hợp lệ)', done => {
    const body = {
      stationNewsTitle: '', //Sai
      stationNewsContent: null, // Sai
      stationNewsAvatar: fakeUserName,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/insert`)
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

  it('Admin lấy tin tức trạm thành công', done => {
    const body = {
      filter: {
        stationNewsCategories: '1',
      },
      skip: 0,
      limit: 20,
    };
    StationNewsTestFunction.adminGetListStationNews(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin lấy tin tức trạm thất bại (stationsUrl: sai)', done => {
    const body = {
      skip: 0,
      limit: 20,
      stationsUrl: 12, // Sai
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsList`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('Admin lấy tin tức trạm thất bại (stationNewsCategories: sai)', done => {
    const body = {
      filter: {
        stationNewsCategories: '1212312',
      },
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsList`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('Admin lấy chi tiết tin tức thành công', done => {
    const body = {
      id: stationNewsId,
    };
    StationNewsTestFunction.adminGetDetailStationNews(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin lấy chi tiết tin tức thất bại (id: sai)', done => {
    const body = {
      id: 1 / 2,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsDetail`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('Admin lấy chi tiết tin tức thất bại (id: âm)', done => {
    const body = {
      id: -5, // Sai
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsDetail`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('Admin cập nhật tin tức bằng id thành công', done => {
    const body = {
      id: stationNewsId,
      data: {
        stationNewsTitle: fakeUserName,
        stationNewsContent: fakeUserName,
        stationNewsAvatar: fakeUserName,
        // isDeleted: 1,
        // isHidden: 1,
        ordinalNumber: 1,
      },
    };
    StationNewsTestFunction.adminUpdateStationNewsById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin cập nhật tin tức bằng id thất bại (id không hợp lệ)', done => {
    const body = {
      id: -1,
      data: {
        stationNewsTitle: fakeUserName,
        stationNewsContent: fakeUserName,
        stationNewsAvatar: fakeUserName,
        // isDeleted: 1,
        // isHidden: 1,
        ordinalNumber: 1,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/updateById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 400);
        }
        done();
      });
  });

  it('Admin xóa tin tức bằng id thành công', done => {
    const body = {
      id: stationNewsId,
    };
    StationNewsTestFunction.adminDeleteStationNewsById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin xóa tin tức bằng id thất bại (input không hợp lệ)', done => {
    const body = {
      id: 'a',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/deleteById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
});
