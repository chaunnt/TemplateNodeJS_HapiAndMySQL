/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function insertApiKey(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/insert`)
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

async function getListApiKey(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/find`)
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

async function getDetailApiKey(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/findById`)
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

async function updateApiKeyById(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/updateById`)
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

async function deleteAPiKeyById(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemApiKey/deleteById`)
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
  insertApiKey,
  getListApiKey,
  getDetailApiKey,
  updateApiKeyById,
  deleteAPiKeyById,
};
