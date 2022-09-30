/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const chai = require('chai');
const chaiHttp = require('chai-http');
const moment = require('moment');

const { checkResponseStatus } = require('../../../Common/test/Common');
const TestFunctions = require('../../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const { GAME_RECORD_TYPE } = require('../../../GameRecord/GameRecordConstant');

describe(`Test WinGo Game`, () => {
  before(done => {
    new Promise(async (resolve, reject) => {
      let userData = await TestFunctions.loginUser();
      userToken = userData.token;
      resolve();
    }).then(() => done());
  });

  const sectionTime = moment().add(1, 'minute').format('YYYYMMDDHHmm');
  const sectionName = sectionTime + GAME_RECORD_TYPE.GAMEWINGO1.replace('WINGO', '0');
  it('Chọn màu xanh', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'XANH',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn màu tím', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'TIM',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn màu đỏ', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'DO',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 1', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;1',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 2', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;2',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 3', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;3',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 4', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;4',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 5', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;5',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 6', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;6',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 7', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;7',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 8', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;8',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 9', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;9',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn số 0', done => {
    const body = {
      betRecordAmountIn: 1000000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NUMBER;0',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn giá trị lớn', done => {
    const body = {
      betRecordAmountIn: 100000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'LON',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('Chọn giá trị nhỏ', done => {
    const body = {
      betRecordAmountIn: 200000,
      sectionName: sectionName,
      betRecordType: GAME_RECORD_TYPE.GAMEWINGO1,
      betRecordValue: 'NHO',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/BetRecords/user/placeRecord`)
      .set('Authorization', `Bearer ${userToken}`)
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
