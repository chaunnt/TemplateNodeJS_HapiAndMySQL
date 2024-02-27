/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function partnerCreateCustomerSchedule(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/createSchedule`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerCancelCustomerSchedule(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/cancelSchedule`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerGetDetailCustomerSchedule(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/getDetailSchedule`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerGetListCustomerSchedule(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/CustomerSchedule/user/getListSchedule`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerGetListStations(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getAllExternal`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerGetAllStationArea(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getAllStationArea`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerGetDetailStation(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getDetail`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerGetListScheduleDateStation(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getListScheduleDate`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

async function partnerGetListScheduleTimeStation(apikey, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PartnerAPI/Stations/user/getListScheduleTime`)
      .set('apiKey', apikey)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        }
      });
  });
}

module.exports = {
  partnerCreateCustomerSchedule,
  partnerCancelCustomerSchedule,
  partnerGetDetailCustomerSchedule,
  partnerGetListCustomerSchedule,

  partnerGetListStations,
  partnerGetAllStationArea,
  partnerGetDetailStation,
  partnerGetListScheduleDateStation,
  partnerGetListScheduleTimeStation,
};
