/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');
const moment = require('moment');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/SystemHolidayCalendarResourceAccess');

const { modelName } = require('../resourceAccess/SystemHolidayCalendarResourceAccess');
const SystemHolidayCalendarTestFunction = require('./SystemHolidayCalendarTestFunction');
const { DATE_DB_SORT_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let id = null;

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginStaff();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('Admin tạo mới ngày nghỉ thành công!', done => {
    const body = {
      scheduleDayOff: moment().format(DATE_DB_SORT_FORMAT),
    };

    SystemHolidayCalendarTestFunction.adminInsertSystemHolidayCalendar(token, body)
      .then(res => {
        id = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Admin tạo mới ngày nghỉ thất bại (ngày nghỉ ở quá khứ)', done => {
    const body = {
      scheduleDayOff: moment().subtract(1, 'days').format(DATE_DB_SORT_FORMAT),
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/insert`)
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

  it('Admin tạo mới ngày nghỉ thất bại (ngày nghỉ đã tồn tại)', done => {
    const body = {
      scheduleDayOff: moment().format(DATE_DB_SORT_FORMAT),
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/insert`)
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

  it('Admin tạo mới ngày nghỉ thất bại (ngày nghỉ sai)', done => {
    const body = {
      scheduleDayOff: -1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/insert`)
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

  it('Admin lấy danh sách ngày nghỉ thành công!', done => {
    const body = {
      startDate: moment().format(DATE_DB_SORT_FORMAT),
      endDate: undefined,
    };

    SystemHolidayCalendarTestFunction.adminGetListSystemHolidayCalendar(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin lấy chi tiết ngày nghỉ thành công', done => {
    const body = {
      id: id,
    };
    SystemHolidayCalendarTestFunction.adminGetDetailSystemHolidayCalendar(token, body)
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
      .post(`/SystemHolidayCalendar/findById`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('Admin lấy chi tiết tin tức thất bại (ngày nghỉ không tồn tại)', done => {
    const body = {
      id: 0,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/findById`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('Admin lấy chi tiết ngày nghỉ thất bại (id: âm)', done => {
    const body = {
      id: -5, // Sai
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/findById`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('Admin cập nhật ngày nghỉ bằng id thất bại (ngày cập nhật đã tồn tại)', done => {
    const body = {
      id: id,
      data: {
        scheduleDayOff: moment().format(DATE_DB_SORT_FORMAT),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/updateById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 400);
        }
        done();
      });
  });

  it('Admin cập nhật ngày nghỉ thành công', done => {
    const body = {
      id: id,
      data: {
        scheduleDayOff: moment().add(1, 'days').format(DATE_DB_SORT_FORMAT),
      },
    };
    SystemHolidayCalendarTestFunction.adminUpdateSystemHolidayCalendarById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin cập nhật ngày nghỉ bằng id thất bại (id không hợp lệ)', done => {
    const body = {
      id: -1,
      data: {
        scheduleDayOff: moment().add(1, 'days').format(DATE_DB_SORT_FORMAT),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/updateById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 400);
        }
        done();
      });
  });

  it('Admin cập nhật ngày nghỉ bằng id thất bại (ngày cập nhật ở quá khứ)', done => {
    const body = {
      id: -1,
      data: {
        scheduleDayOff: moment().subtract(1, 'days').format(DATE_DB_SORT_FORMAT),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/updateById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 400);
        }
        done();
      });
  });

  it('Admin xóa ngày nghỉ bằng id thành công', done => {
    const body = {
      id: id,
    };
    SystemHolidayCalendarTestFunction.adminDeleteSystemHolidayCalendarById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin xóa ngày nghỉ bằng id thất bại (input không hợp lệ)', done => {
    const body = {
      id: 'a',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/deleteById`)
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
