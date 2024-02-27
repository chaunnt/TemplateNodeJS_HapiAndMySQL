/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function adminInsertSystemNotification(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/insert`)
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

async function adminGetAllSystemNotification(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/find`)
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

async function adminGetDetailSystemNotification(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/findById`)
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

async function adminUpdateSystemNotification(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/updateById`)
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

async function adminDeleteSystemNotification(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/deleteById`)
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

async function userGetAllSystemNotification(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/user/getList`)
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

async function userGetDetailSystemNotification(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemNotification/user/getDetailById`)
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
  adminInsertSystemNotification,
  adminGetAllSystemNotification,
  adminGetDetailSystemNotification,
  adminUpdateSystemNotification,
  adminDeleteSystemNotification,
  userGetAllSystemNotification,
  userGetDetailSystemNotification,
};
