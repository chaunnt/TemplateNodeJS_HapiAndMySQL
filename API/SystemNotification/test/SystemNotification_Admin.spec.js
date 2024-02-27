/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/SystemNotificationResourceAccess');

const { NOTIFICATION_STATUS } = require('../SystemNotificationConstants');
const SystemNotificationTestFunction = require('./SystemNotificationTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let systemNotificationId = null;

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

  // ================ /SystemNotification/insert =============================

  it('Admin tạo thông báo thành công', done => {
    const body = {
      notificationContent: randomString,
      notificationImage: randomString,
      notificationMessageNote: randomString,
    };

    SystemNotificationTestFunction.adminInsertSystemNotification(token, body)
      .then(res => {
        systemNotificationId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Admin tạo thông báo thất bại (notificationContent không hợp lệ)', done => {
    const body = {
      notificationContent: '',
      notificationImage: randomString,
      notificationMessageNote: randomString,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/insert`)
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

  // // ================ /SystemNotification/find =============================

  it('Admin lấy danh sách thông báo quảng cáo thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 10,
    };

    SystemNotificationTestFunction.adminGetAllSystemNotification(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // // ================ /SystemNotification/findById =============================

  it('Admin Lấy chi tiết thông báo thành công', done => {
    const body = {
      id: systemNotificationId,
    };

    SystemNotificationTestFunction.adminGetDetailSystemNotification(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin Lấy chi tiết thông báo thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/findById`)
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

  it('Admin Lấy chi tiết thông báo thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/findById`)
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

  // // ================  /SystemNotification/updateById =============================

  it('Admin cập nhật thông báo thành công', done => {
    const body = {
      id: systemNotificationId,
      data: {
        notificationContent: randomString + 'update',
        notificationImage: randomString + 'update',
        notificationMessageNote: randomString + 'update',
      },
    };

    SystemNotificationTestFunction.adminUpdateSystemNotification(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin cập nhật thông báo thất bại (id âm)', done => {
    const body = {
      id: -1,
      data: {
        notificationContent: randomString + 'update',
        notificationImage: randomString + 'update',
        notificationMessageNote: randomString + 'update',
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/updateById`)
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

  it('Admin cập nhật thông báo thất bại (id không là số)', done => {
    const body = {
      id: 'abc',
      data: {
        notificationContent: randomString + 'update',
        notificationImage: randomString + 'update',
        notificationMessageNote: randomString + 'update',
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/updateById`)
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

  it('Admin cập nhật thông báo thất bại (bannerSection sai)', done => {
    const body = {
      id: -1,
      data: {
        notificationContent: '',
        notificationImage: randomString + 'update',
        notificationMessageNote: randomString + 'update',
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/updateById`)
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

  // // ================ /SystemNotification/deleteById =============================

  it('Admin xóa thông báo thành công', done => {
    const body = {
      id: systemNotificationId,
    };

    SystemNotificationTestFunction.adminDeleteSystemNotification(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin xóa thông báo thất bại (id âm)', done => {
    const body = {
      id: -1,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/deleteById`)
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

  it('Admin xóa thông báo thất bại (id không là số)', done => {
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
