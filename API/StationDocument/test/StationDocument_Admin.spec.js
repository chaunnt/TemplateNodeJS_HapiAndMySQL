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
      let staffData = await TestFunctions.loginStaff();
      console.log(staffData.token);
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  // ================ /StationDocument/uploadDocumentForStation =============================

  it('Admin upload tài liệu cho trạm thành công', done => {
    const body = {
      documentCode: 'CV1',
      documentTitle: 'Công văn',
      documentCategory: DOCUMENT_CATEGORY.OFFICIAL_LETTER,
      stationsId: 11,
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

    StationDocumentTestFunction.adminUploadDocumentForStation(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin upload tài liệu cho trạm thất bại (stationsId không hợp lệ)', done => {
    const body = {
      documentCode: 'CV1',
      documentTitle: 'Công văn',
      documentCategory: DOCUMENT_CATEGORY.OFFICIAL_LETTER,
      stationsId: -11, //Sai
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
      .post(`/StationDocument/uploadDocumentForStation`)
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

  it('Admin upload tài liệu cho trạm thất bại (documentCategory không hợp lệ)', done => {
    const body = {
      documentCode: 'CV1',
      documentTitle: 'Công văn',
      documentCategory: 1213123,
      stationsId: 1,
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
      .post(`/StationDocument/uploadDocumentForStation`)
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

  it('Admin upload tài liệu cho trạm thất bại (documentFileUrlList không hợp lệ)', done => {
    const body = {
      documentCode: 'CV1',
      documentTitle: 'Công văn',
      documentCategory: 1121212, //Sai
      stationsId: 1,
      documentPublishedDay: '29/11/2023',
      documentExpireDay: '30/11/2023',
      documentFileUrlList: [{}], // Sai
      documentContent: '<p>adasdasdasdasd</p>',
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/uploadDocumentForStation`)
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

  // ================ /StationDocument/insert =============================

  it('Admin upload tài liệu cho tất cả các trạm thành công', done => {
    const body = {
      documentCode: 'CV1',
      documentTitle: 'Công văn',
      documentCategory: DOCUMENT_CATEGORY.OFFICIAL_LETTER,
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

    StationDocumentTestFunction.adminUploadDocumentForAllStation(token, body)
      .then(res => {
        stationDocumentId = res[0];
        done();
      })
      .catch(error => done(error));
  });

  it('Admin upload tài liệu cho tất cả các trạm thất bại (documentCategory không hợp lệ)', done => {
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
      .post(`/StationDocument/insert`)
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

  // ================ /StationDocument/find =============================

  it('Admin Lấy tất cả tài liệu thành công', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };

    StationDocumentTestFunction.adminGetAllStationDocument(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  // ================ /StationDocument/findById =============================

  it('Admin Lấy chi tiết tài liệu thành công', done => {
    const body = {
      id: stationDocumentId,
    };

    StationDocumentTestFunction.adminGetDetailStationDocumentById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin Lấy chi tiết tài liệu thất bại (id âm)', done => {
    const body = {
      id: -1, // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/findById`)
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

  it('Admin Lấy chi tiết tài liệu thất bại (id không là số)', done => {
    const body = {
      id: 'abc', // Sai
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/findById`)
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

  // ================  /StationDocument/updateById =============================

  it('Admin cập nhật chi tiết tài liệu thành công', done => {
    const body = {
      id: stationDocumentId,
      data: {
        documentCode: randomString,
        documentTitle: randomString,
      },
    };

    StationDocumentTestFunction.adminUpdateStationDocumentById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin cập nhật chi tiết tài liệu thất bại (id âm)', done => {
    const body = {
      id: -1,
      data: {
        documentCode: randomString,
        documentTitle: randomString,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/updateById`)
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

  it('Admin cập nhật liệu thất bại (id không là số)', done => {
    const body = {
      id: 'abc',
      data: {
        documentCode: randomString,
        documentTitle: randomString,
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationDocument/updateById`)
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

  // ================ /StationDocument/deleteById =============================

  it('Admin xóa tài liệu thành công', done => {
    const body = {
      id: stationDocumentId,
    };

    StationDocumentTestFunction.adminDeleteStationDocumentById(token, body)
      .then(res => {
        done();
      })
      .catch(error => done(error));
  });

  it('Admin xóa tài liệu thất bại (id âm)', done => {
    const body = {
      id: -1,
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
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Admin xóa liệu thất bại (id không là số)', done => {
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
