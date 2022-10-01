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

describe(`Test K3 Game`, () => {
  before(done => {
    new Promise(async (resolve, reject) => {
      let userData = await TestFunctions.loginUser();
      userToken = userData.token;
      resolve();
    }).then(() => done());
  });

  for (let i = 3; i <= 18; i++) {
    it('Tổng ' + i, done => {
      const body = {
        betRecordAmountIn: 1000000,
        sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
        betRecordType: GAME_RECORD_TYPE.GAMEK31,
        betRecordValue: 'TONG;' + i,
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
  }

  it('Tổng lẻ', done => {
    const body = {
      betRecordAmountIn: 1304000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: 'TONG;LE',
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

  it('Tổng chẵn', done => {
    const body = {
      betRecordAmountIn: 1304000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: 'TONG;CHAN',
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

  it('Tổng lớn', done => {
    const body = {
      betRecordAmountIn: 1104000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: 'TONG;LON',
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

  it('Tổng nhỏ', done => {
    const body = {
      betRecordAmountIn: 1104000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: 'TONG;LON',
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

  it('2 số trùng', done => {
    const body = {
      betRecordAmountIn: 1104000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '2SOTRUNGCAP;11',
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

  it('2 số trùng', done => {
    const body = {
      betRecordAmountIn: 2204000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '2SOTRUNGCAP;22',
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

  it('3 số', done => {
    const body = {
      betRecordAmountIn: 2240000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '2SOTRUNGCAPSO;22;4',
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

  it('3 số', done => {
    const body = {
      betRecordAmountIn: 2250000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '2SOTRUNGCAPSO;22;5',
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

  it('3 số', done => {
    const body = {
      betRecordAmountIn: 334000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '2SOTRUNGCAPSO;33;4',
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

  it('3 số trùng', done => {
    const body = {
      betRecordAmountIn: 333000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '3SOTRUNGDUYNHAT;333',
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

  it('3 số trùng', done => {
    const body = {
      betRecordAmountIn: 444000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '3SOTRUNGDUYNHAT;444',
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

  it('3 số khác', done => {
    const body = {
      betRecordAmountIn: 346800,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '3SOTRUNGKHACNHAU;3;4;6;8',
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

  it('2 số khác', done => {
    const body = {
      betRecordAmountIn: 346800,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAMEK31,
      betRecordValue: '2SOTRUNGKHACNHAU;3;4;6;8',
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
