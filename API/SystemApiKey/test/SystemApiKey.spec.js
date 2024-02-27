/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const SystemApiKeyTestFunction = require('./SystemApiKeyTestFunction');
const { SETTING } = require('../SystemApiKeyConstants');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/SystemApiKeyResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let apiKey = '2898a2a7-bdde-414a-8ef8-272328be6c82';

  before(done => {
    new Promise(async function (resolve, reject) {
      let advanceUserData = await TestFunctions.loginStaff();
      token = advanceUserData.token;
      resolve();
    }).then(() => done());
  });

  // =============== /SystemApiKey/insert ============

  it(`Admin thêm apikey thành công! (input hợp lệ) `, done => {
    const body = {
      apiKeyName: faker.name.firstName().toUpperCase(),
      stationsId: 2000,
      apiKeyEnable: SETTING.DISABLE,
    };

    SystemApiKeyTestFunction.insertApiKey(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin thêm apikeys thất bại! (apiKeyEnable sai) `, done => {
    const body = {
      apiKeyName: faker.name.firstName().toUpperCase(),
      apiKeyEnable: 77,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/insert`)
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

  // =============== /SystemApiKey/find ============

  it(`Admin lấy danh sách apikeys thành công! (input hợp lệ ) `, done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    SystemApiKeyTestFunction.getListApiKey(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin lấy danh sách apikeys thành công! (input hợp lệ ) `, done => {
    const body = {
      filter: {
        apiKey: apiKey,
      },
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    SystemApiKeyTestFunction.getListApiKey(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin lấy danh sách apikeys thất bại! ( apiKey không hợp lệ) `, done => {
    const body = {
      filter: {
        apiKey: '',
      },
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/find`)
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

  // =============== /SystemApiKey/findById ============

  it(`Admin lấy chi tiết apikey thành công! (input hợp lệ ) `, done => {
    const body = {
      id: apiKey,
    };
    SystemApiKeyTestFunction.getDetailApiKey(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin lấy chi tiết apikey thất bại! (id < 0 hoặc string không hợp lệ)) `, done => {
    const body = {
      id: -27,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/findById`)
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

  it(`Admin lấy chi tiết apikey thất bại! (id < 0 hoặc string không hợp lệ)) `, done => {
    const body = {
      id: 'asdfghjklpoiuyttrrre',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/findById`)
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

  // =============== /SystemApiKey/updateById ============

  it(`Admin cập nhật trạng thái api thành công!`, done => {
    const body = {
      id: apiKey,
      // apiKeyName: faker.name.firstName().toUpperCase(),
      data: {
        apiKeyEnable: SETTING.DISABLE,
      },
    };

    SystemApiKeyTestFunction.updateApiKeyById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it(`Admin cập nhật thông tin apikey thất bại! (id < 0 hoặc string không hợp lệ)`, done => {
    const body = {
      id: -46,
      data: {
        apiKeyEnable: SETTING.DISABLE,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/updateById`)
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

  it(`Admin cập nhật thông tin apikey thất bại! (update field không được phép)`, done => {
    const body = {
      id: apiKey,
      data: {
        apiKeyEnable: SETTING.DISABLE,
        apiKeyName: faker.name.firstName().toUpperCase(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/updateById`)
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

  // =============== /SystemApiKey/deleteById ============

  it('Admin xóa apikey thành công!', done => {
    const bodyFilter = {
      filter: {
        stationsId: 2000,
      },
    };

    SystemApiKeyTestFunction.getListApiKey(token, bodyFilter)
      .then(res => {
        const apikey = res.data[0].apiKey;

        SystemApiKeyTestFunction.deleteAPiKeyById(token, {
          id: apikey,
        }).then(() => {
          done();
        });
      })
      .catch(error => done(error));
  });

  it(`Admin xóa apikey thất bại! (id < 0 hoặc string)`, done => {
    const body = {
      id: '',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/deleteById`)
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
