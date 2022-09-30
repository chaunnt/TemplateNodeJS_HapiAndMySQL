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

describe(`Test 5D Game`, () => {
  before(done => {
    new Promise(async (resolve, reject) => {
      let userData = await TestFunctions.loginUser();
      userToken = userData.token;
      resolve();
    }).then(() => done());
  });

  it('chọn A và số 1', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;1',
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

  it('chọn A và số 2', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;2',
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

  it('chọn A và số 3', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;3',
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

  it('chọn A và số 4', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;4',
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

  it('chọn A và NHO', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;NHO',
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

  it('chọn A và LON', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;LON',
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

  it('chọn A và LE', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;LE',
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

  it('chọn A và CHAN', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;CHAN',
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

  it('chọn A và số, cược < 10000 -> lỗi', done => {
    const body = {
      betRecordAmountIn: 1100,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'A;1',
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
        checkResponseStatus(res, 400);
        done();
      });
  });

  it('chọn B và số 5', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'B;5',
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

  it('chọn B và số 6', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'B;6',
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

  it('chọn B và số 7', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'B;7',
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

  it('chọn B và NHO', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'B;NHO',
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

  it('chọn B và LON', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'B;LON',
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

  it('chọn B và LE', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'B;LE',
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

  it('chọn B và CHAN', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'B;CHAN',
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

  it('chọn C và số 8', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'C;8',
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

  it('chọn C và NHO', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'C;NHO',
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

  it('chọn C và LON', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'C;LON',
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

  it('chọn C và LE', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'C;LE',
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

  it('chọn C và CHAN', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'C;CHAN',
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

  it('chọn D và số 9', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'D;9',
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

  it('chọn D và NHO', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'D;NHO',
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

  it('chọn D và LON', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'D;LON',
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

  it('chọn D và LE', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'D;LE',
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

  it('chọn D và CHAN', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'D;CHAN',
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

  it('chọn TONG và NHO', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
      betRecordValue: 'TONG;NHO',
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

  it('chọn TONG và LON', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
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

  it('chọn TONG và LE', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
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

  it('chọn TONG và CHAN', done => {
    const body = {
      betRecordAmountIn: 11000,
      sectionName: moment().add(1, 'minute').format('YYYYMMDDHHmm'),
      betRecordType: GAME_RECORD_TYPE.GAME5D1,
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
});
