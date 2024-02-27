/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/SystemPromoBannersResourceAccess');

const { BANNER_SECTION } = require('../SystemPromoBannersConstants');
const SystemPromoBannersTestFunction = require('./SystemPromoBannersTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let systemPromoBannersId = null;

  let randomString = faker.name.firstName() + faker.name.lastName();
  randomString = randomString.replace("'", '');

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginStaff();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // ================ /SystemPromoBanners/insert =============================

  it('Admin tạo banner quảng cáo thành công', done => {
    const body = {
      bannerName: randomString,
      bannerNote: randomString,
      bannerImageUrl: randomString,
      bannerSection: BANNER_SECTION.STATIONS,
    };

    SystemPromoBannersTestFunction.adminInsertSystemPromoBanners(token, body)
      .then(res => {
        systemPromoBannersId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Admin tạo banner quảng cáo thất bại (bannerSection không hợp lệ)', done => {
    const body = {
      bannerName: randomString,
      bannerNote: randomString,
      bannerImageUrl: randomString,
      bannerSection: 1232331,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/insert`)
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

  it('Admin tạo banner quảng cáo thất bại  (bannerImageUrl không hợp lệ)', done => {
    const body = {
      bannerName: randomString,
      bannerNote: randomString,
      bannerImageUrl: '', // Sai
      bannerSection: BANNER_SECTION.STATIONS,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/insert`)
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

  // // ================ /SystemPromoBanners/find =============================

  it('Admin lấy danh sách banner quảng cáo thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 10,
    };

    SystemPromoBannersTestFunction.adminGetAllSystemPromoBanners(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // ================ /SystemPromoBanners/findById =============================

  it('Admin Lấy chi tiết banner quảng cáo thành công', done => {
    const body = {
      id: systemPromoBannersId,
    };

    SystemPromoBannersTestFunction.adminGetDetailSystemPromoBanners(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin Lấy chi tiết banner quảng cáo thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/findById`)
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

  it('Admin Lấy chi tiết banner quảng cáo thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/findById`)
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

  // // ================  /SystemPromoBanners/updateById =============================

  it('Admin cập nhật banner quảng cáo thành công', done => {
    const body = {
      id: systemPromoBannersId,
      data: {
        bannerName: randomString + 'update',
        bannerNote: randomString + 'update',
        bannerSection: BANNER_SECTION.STATIONS,
      },
    };

    SystemPromoBannersTestFunction.adminUpdateSystemPromoBanners(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin cập nhật banner quảng cáo thất bại (id âm)', done => {
    const body = {
      id: -1,
      data: {
        bannerName: randomString + 'update',
        bannerNote: randomString + 'update',
        bannerSection: BANNER_SECTION.STATIONS,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/updateById`)
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

  it('Admin cập nhật banner quảng cáo thất bại (id không là số)', done => {
    const body = {
      id: 'abc',
      data: {
        bannerName: randomString + 'update',
        bannerNote: randomString + 'update',
        bannerSection: BANNER_SECTION.STATIONS,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/updateById`)
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

  it('Admin cập nhật banner quảng cáo thất bại (bannerSection sai)', done => {
    const body = {
      id: -1,
      data: {
        bannerName: randomString + 'update',
        bannerNote: randomString + 'update',
        bannerSection: 99999999,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/updateById`)
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

  // // ================ /SystemPromoBanners/deleteById =============================

  it('Admin xóa baanner quảng cáo thành công', done => {
    const body = {
      id: systemPromoBannersId,
    };

    SystemPromoBannersTestFunction.adminDeleteSystemPromoBanners(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin xóa baanner quảng cáo thất bại (id âm)', done => {
    const body = {
      id: -1,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/deleteById`)
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

  it('Admin xóa baanner quảng cáo thất bại (id không là số)', done => {
    const body = {
      id: 'abc',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/deleteById`)
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
