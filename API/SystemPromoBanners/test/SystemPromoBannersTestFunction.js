/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function adminInsertSystemPromoBanners(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/insert`)
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

async function adminGetAllSystemPromoBanners(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/find`)
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

async function adminGetDetailSystemPromoBanners(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/findById`)
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

async function adminUpdateSystemPromoBanners(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/updateById`)
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

async function adminDeleteSystemPromoBanners(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/deleteById`)
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

async function userGetAllSystemPromoBanners(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/user/getList`)
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

async function userGetDetailSystemPromoBanners(token, body) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SystemPromoBanners/user/getDetailById`)
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
  adminInsertSystemPromoBanners,
  adminGetAllSystemPromoBanners,
  adminGetDetailSystemPromoBanners,
  adminUpdateSystemPromoBanners,
  adminDeleteSystemPromoBanners,
  userGetAllSystemPromoBanners,
  userGetDetailSystemPromoBanners,
};
