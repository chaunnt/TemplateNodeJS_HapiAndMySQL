/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../../../server');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationDocumentResourceAccess');

const { DOCUMENT_CATEGORY } = require('../StationDocumentConstants');
const StationDocumentTestFunction = require('./StationDocumentTestFunction');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let stationDocumentId = null;

  let randomString = faker.name.firstName() + faker.name.lastName();
  randomString = randomString.replace("'", '');

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // ================ /StationDocument/advanceUser/uploadDocument =============================

  it('Trạm upload tài liệu cho tất cả các trạm thành công', done => {
    const body = {
      documentCode: 'CV124',
      documentTitle: 'Công van 999999',
      documentCategory: DOCUMENT_CATEGORY.OFFICIAL_LETTER,
      documentPublishedDay: '29/11/2023',
      documentExpireDay: '30/11/2023',
      documentContent: '<p>fsdfsdfsdf</p>',
      documentFileUrlList: [
        {
          documentFileName: 'download.jpg',
          documentFileSize: 102279,
          documentFileUrl: 'https://dev320-api.captain.ttdk.com.vn/uploads/media/yms3xhg5w11h9kkutorj_2023-11-29T10:31:06.762Z.jpg',
        },
      ],
    };

    StationDocumentTestFunction.advanceUserUploadDocument(token, body)
      .then(res => {
        stationDocumentId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Trạm upload tài liệu cho tất cả các trạm thất bại (documentCategory không hợp lệ)', done => {
    const body = {
      documentCode: 'CV1',
      documentTitle: 'Công văn',
      documentCategory: 123123,
      documentPublishedDay: '29/11/2023',
      documentExpireDay: '30/11/2023',
      documentFileUrlList: [
        {
          documentFileUrl: 'https://dev320-api.captain.ttdk.com.vn/uploads/media/wh101rp8dokjmxcqqydrq_2023-11-29T08:55:15.168Z.jpg',
          documentFileName: 'Lofi Chill_ (16).jpg',
          documentFileSize: 1898505,
        },
      ],
      documentContent: '<p>adasdasdasdasd</p>',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/uploadDocument`)
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

  // ================ /StationDocument/advanceUser/getListDocument =============================

  it('Trạm lấy tất cả tài liệu công khai thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };

    StationDocumentTestFunction.advanceUserGetListPublicStationDocument(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // ================ /StationDocument/advanceUser/getListStationDocument =============================

  it('Trạm lấy tất cả tài liệu của chính trạm thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };

    StationDocumentTestFunction.advanceUserGetListPrivateStationDocument(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // ================ /StationDocument/advanceUser/getDetailDocument =============================

  it('Trạm Lấy chi tiết tài liệu thành công', done => {
    const body = {
      id: stationDocumentId,
    };

    StationDocumentTestFunction.advanceUserGetDetailStationDocumentById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Trạm Lấy chi tiết tài liệu thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/getDetailDocument`)
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

  it('Trạm Lấy chi tiết tài liệu thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/getDetailDocument`)
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

  // ================  /StationDocument/advanceUser/updateDocument =============================

  it('Trạm cập nhật chi tiết tài liệu thành công', done => {
    const body = {
      id: stationDocumentId,
      data: {
        documentCode: randomString,
        documentTitle: randomString,
      },
    };

    StationDocumentTestFunction.advanceUserUpdateStationDocumentById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Trạm cập nhật chi tiết tài liệu thất bại (id âm)', done => {
    const body = {
      id: -1,
      data: {
        documentCode: randomString,
        documentTitle: randomString,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/updateDocument`)
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

  it('Trạm cập nhật liệu thất bại (id không là số)', done => {
    const body = {
      id: 'abc',
      data: {
        documentCode: randomString,
        documentTitle: randomString,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/updateDocument`)
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

  // ================ /StationDocument/advanceUser/removeDocument =============================

  it('Trạm xóa tài liệu thành công', done => {
    const body = {
      id: stationDocumentId,
    };

    StationDocumentTestFunction.advanceUserDeleteStationDocumentById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Trạm xóa tài liệu thất bại (id âm)', done => {
    const body = {
      id: -1,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/removeDocument`)
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

  it('Trạm xóa tài liệu thất bại (id không là số)', done => {
    const body = {
      id: 'abc',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/removeDocument`)
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

  it('Trạm xóa tài liệu thất bại (tài liệu không phải của trạm)', done => {
    const body = {
      id: 100,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/advanceUser/removeDocument`)
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
});
