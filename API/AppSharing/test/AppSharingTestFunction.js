/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

async function createShareLinkStaionNews(token, id) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .get(`/AppSharing/StationNews/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res);
        }
      });
  });
}

async function createShareLinkStaions(token, stationCode) {
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .get(`/AppSharing/Stations/${stationCode}`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          checkResponseStatus(res, 200);
          resolve(res);
        }
      });
  });
}

module.exports = {
  createShareLinkStaionNews,
  createShareLinkStaions,
};
