/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/AppUserDocumentResourceAccess');
const { DOCUMENT_TYPE } = require('../AppUserDocumentConstant');
const AppUserDocumentTestFunction = require('./AppUserDocumentTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let appUserDocumentId = null;

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('Nhân viên trạm tạo user document thành công (input hợp lệ)', done => {
    const body = {
      appUserId: 5622,
      documentName: 'Document Test',
      documentType: DOCUMENT_TYPE.PROFILE,
      documentURL: 'https://dev320-api.captain.ttdk.com.vn/uploads/media/9f1oay5voupz23oa4hhmy_2023-11-09T11:41:12.208Z.png',
    };

    AppUserDocumentTestFunction.advanceUserInsertUserDocument(token, body)
      .then(res => {
        appUserDocumentId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Nhân viên trạm tạo user document thất bại (input không hợp lệ)', done => {
    const body = {
      appUserId: 'add',
      documentName: 'Document Test',
      documentType: 8,
      documentURL: 'https://dev320-api.captain.ttdk.com.vn/uploads/media/9f1oay5voupz23oa4hhmy_2023-11-09T11:41:12.208Z.png',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserDocument/advanceUser/addDocument`)
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

  it('Nhân viên trạm xóa tài liệu của user thành công', done => {
    const body = {
      appUserId: 5622,
      appUserDocumentId: appUserDocumentId,
    };

    AppUserDocumentTestFunction.advanceUserDeleteUserDocument(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Nhân viên trạm xóa tài liệu của user thất bại (input không hợp lệ)', done => {
    const body = {
      appUserId: 'abc',
      appUserDocumentId: appUserDocumentId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUserDocument/advanceUser/deleteDocument`)
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
