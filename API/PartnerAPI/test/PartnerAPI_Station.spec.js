/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const moment = require('moment');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const PartnerAPITestFunctions = require('./PartnerAPITestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const app = require('../../../server');

describe(`Tests API Partner Momo`, function () {
  const apikey = '06641c91-d30d-4934-bb5d-80cd2ae71b21';

  // =================== API LẤY DANH SÁCH TRUNG TÂM ==================================
  it('Partner lấy danh danh trung tâm thành công!', done => {
    const body = {
      filter: {
        stationArea: 'An Giang',
      },
    };
    PartnerAPITestFunctions.partnerGetListStations(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // =============== API LẤY DANH SÁCH KHU VỰC ==============================
  it('Partner lấy danh danh khu vực thành công!', done => {
    const body = {};

    PartnerAPITestFunctions.partnerGetAllStationArea(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // ================ API LẤY CHI TIẾT TRUNG TÂM =================
  it('Partner lấy chi tiết trung tâm thành công!', done => {
    const body = {
      id: 36,
    };

    PartnerAPITestFunctions.partnerGetDetailStation(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Partner lấy chi tiết trung tâm thất bại! (input không hợp lệ)', done => {
    const body = {
      id: -36,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getDetail`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Partner lấy chi tiết trung tâm thất bại! (apikey không hợp lệ)', done => {
    const body = {
      id: 36,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getDetail`)
      .set('apiKey', `abc`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 505);
        done();
      });
  });

  // =================== API LẤY NGÀY RẢNH CỦA TRUNG TÂM ==============================

  it('Partner lấy ngày rảnh của trung tâm thành công!', done => {
    const body = {
      stationsId: 36,
      startDate: moment().format('DD/MM/YYYY'),
      endDate: moment().add(5, 'days').format('DD/MM/YYYY'),
      vehicleType: 1,
    };
    PartnerAPITestFunctions.partnerGetListScheduleDateStation(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Partner lấy ngày rảnh của trung tâm thất bại! (input không hợp lệ)', done => {
    const body = {
      stationsId: -36, // Sai
      startDate: moment().format('DD/MM/YYYY'),
      endDate: moment().add(5, 'days').format('DD/MM/YYYY'),
      //vehicleType: 1 // Bỏ trống: Sai
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getListScheduleDate`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  // ========================== API LẤY GIỜ RẢNH CỦA TRUNG TÂM =============================
  it('Partner lấy giờ rảnh của trung tâm thành công!', done => {
    const body = {
      stationsId: 36,
      date: moment().format('DD/MM/YYYY'),
      vehicleType: 1,
    };

    PartnerAPITestFunctions.partnerGetListScheduleTimeStation(apikey, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Partner lấy giờ rảnh của trung tâm thất bại! (input không hợp lệ)', done => {
    const body = {
      stationsId: -36,
      date: '13/09/2023',
      vehicleType: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getListScheduleTime`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('Partner lấy giờ rảnh của trung tâm thất bại! (date ở quá khứ)', done => {
    const body = {
      stationsId: 36,
      date: '10/09/2023',
      vehicleType: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getListScheduleTime`)
      .set('apiKey', `${apikey}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Partner lấy giờ rảnh của trung tâm thất bại! (input thiếu)', done => {
    const body = {
      stationsId: 36,
      date: '13/09/2023',
      // vehicleType: 1
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getListScheduleTime`)
      .set('apiKey', `${apikey}`)
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
