/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function adminInsertSystemHolidayCalendar(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/insert`)
      .set('Authorization', `Bearer ${token}`)
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

async function adminGetListSystemHolidayCalendar(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/find`)
      .set('Authorization', `Bearer ${token}`)
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

async function adminGetDetailSystemHolidayCalendar(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/findById`)
      .set('Authorization', `Bearer ${token}`)
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

async function adminDeleteSystemHolidayCalendarById(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/deleteById`)
      .set('Authorization', `Bearer ${token}`)
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

async function adminUpdateSystemHolidayCalendarById(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemHolidayCalendar/updateById`)
      .set('Authorization', `Bearer ${token}`)
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
  adminInsertSystemHolidayCalendar,
  adminGetListSystemHolidayCalendar,
  adminGetDetailSystemHolidayCalendar,
  adminDeleteSystemHolidayCalendarById,
  adminUpdateSystemHolidayCalendarById,
};
