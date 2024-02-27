/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { checkResponseStatus } = require('../../Common/test/Common');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

// Define a function to delete a vehicle
function deleteVehicle(token, vehicleId, done) {
  chai
    .request(`0.0.0.0:${process.env.PORT}`)
    .post(`/AppUserVehicle/user/deleteVehicle`)
    .set('Authorization', `Bearer ${token}`)
    .send({ id: vehicleId })
    .end((err, res) => {
      if (err) {
        console.error(err);
        done(err);
      } else {
        checkResponseStatus(res, 200);
        done();
      }
    });
}

module.exports = {
  deleteVehicle,
};
