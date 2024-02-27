/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const moment = require('moment');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/MessageCustomerMarketingResourceAccess');
const { MESSAGE_CATEGORY } = require('../MessageCustomerMarketingConstant');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let messageId;
  let token = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      token = staffData.token;
      done();
      resolve();
    });
  });

  it('POST /MessageCustomerMarketing/sendMessageByFilter SMS template 1 & filter empty', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      customerMessageTemplateId: 1,
      filter: {},
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByFilter`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByFilter SMS template 1 & filter startDate', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      customerMessageTemplateId: 1,
      filter: {
        startDate: moment().format('DD/MM/YYYY'),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByFilter`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByFilter SMS template 1 & filter endDate', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      customerMessageTemplateId: 1,
      filter: {
        endDate: moment().format('DD/MM/YYYY'),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByFilter`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByFilter SMS template 1 & filter searchText', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      customerMessageTemplateId: 1,
      filter: {
        searchText: faker.name.findName(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByFilter`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByFilter SMS template 1 & no filter', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      customerMessageTemplateId: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByFilter`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByFilter SMS no template', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      filter: {},
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByFilter`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByFilter Email', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
      filter: {},
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByFilter`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('POST /MessageCustomerMarketing/sendMessageByCustomerList SMS template 1 & no filter', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      customerMessageTemplateId: 1,
      customerRecordIdList: [16],
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByCustomerList`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByCustomerList SMS no template', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.SMS,
      customerRecordIdList: [16],
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByCustomerList`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('POST /MessageCustomerMarketing/sendMessageByCustomerList Email', done => {
    const body = {
      customerMessageContent: faker.name.findName(),
      customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
      customerRecordIdList: [16],
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageCustomerMarketing/sendMessageByCustomerList`)
      .set('Authorization', `Bearer ${token}`)
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
