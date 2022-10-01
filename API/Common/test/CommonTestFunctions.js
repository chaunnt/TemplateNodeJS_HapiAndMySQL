/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const chai = require('chai');
require('dotenv').config();
const { checkResponseStatus } = require('./Common');

async function loginStaff() {
  const body = {
    username: 'string',
    password: 'string',
  };
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Staff/loginStaff`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(`error login staff:`, err);
          reject(undefined);
        }
        checkResponseStatus(res, 200);
        resolve(res.body.data);
      });
  });
}

async function loginAgency() {
  const body = {
    username: 'agency',
    password: 'string',
  };
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Staff/loginStaff`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(`error login Agency:`, err);
          reject(undefined);
        }
        checkResponseStatus(res, 200);
        resolve(res.body.data);
      });
  });
}

async function loginUser(username = 'string', password = 'string') {
  const body = {
    username: username,
    password: password,
  };
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/loginUser`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(`error login user:`, err);
        }
        checkResponseStatus(res, 200);
        resolve(res.body.data);
      });
  });
}
module.exports = {
  loginStaff,
  loginUser,
  loginAgency,
};
