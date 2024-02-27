/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const VRORGFunctions = require('../../../ThirdParty/VRORGAPI/VRORGFunctions');
const AppUserVehicleFunctions = require('../../AppUserVehicle/AppUserVehicleFunctions');
const { UNKNOWN_ERROR, API_FAILED } = require('../../Common/CommonConstant');
const { ERROR_CRIMINAL_VR_API } = require('../CriminalVRApiConstants');
const { CRIMINAL_STATUS, HAS_CRIMINAL } = require('../../CustomerCriminalRecord/CustomerCriminalRecordConstants');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { fetchVehicleDataFromVrAPI } = require('../VRAPIFunctions');
chai.use(chaiHttp);

async function checkCriminalFromVr(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = req.payload.data;
      const licensePlates = data.licensePlates;
      const certificateSeries = data.certificateSeries;
      const plateColor = data.plateColor;

      const vehicleDataFromVr = await fetchVehicleDataFromVrAPI(licensePlates, certificateSeries, plateColor);

      let criminalData = [];

      if (vehicleDataFromVr) {
        let messageContent = `Cảnh báo đăng kiểm.`;
        criminalData = [
          {
            customerRecordPlatenumber: licensePlates,
            crimeRecordContent: messageContent,
            crimeRecordStatus: vehicleDataFromVr.criminal === HAS_CRIMINAL.YES ? CRIMINAL_STATUS.NO : CRIMINAL_STATUS.NOT_CRIMINAL,
            crimeRecordPIC: 'Cảnh báo từ cục đăng kiểm',
            ...vehicleDataFromVr,
          },
        ];
      }

      return resolve(criminalData);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userCheckCriminalFromVr(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = req.payload.data;
      const licensePlates = data.licensePlates;
      const certificateSeries = data.certificateSeries;
      const plateColor = data.plateColor || 'T';

      const currentUserId = req.currentUser.appUserId;

      // Kiểm tra xe tra cứu của người dùng đã có trong hệ thống chưa
      const validNewRegister = await AppUserVehicleFunctions.checkIfVehicleRegistered(licensePlates, currentUserId);
      if (validNewRegister) {
        return reject(ERROR_CRIMINAL_VR_API.VEHICLE_NOT_REGISTERED);
      }

      chai
        .request(`${process.env.HOST_VR_CRIMINAL_SERVICE_URL}`)
        .post(`/CriminalVRApi/checkCriminalFromVr`)
        .set('apiKey', `${process.env.SYSTEM_API_KEY}`)
        .send({
          data: {
            licensePlates: licensePlates,
            certificateSeries: certificateSeries,
            plateColor: plateColor,
          },
        })
        .end((err, res) => {
          if (err) {
            return reject(API_FAILED);
          }

          let result = res.body;
          if (result) {
            resolve(result.data);
          } else {
            resolve(undefined);
          }
        });
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  checkCriminalFromVr,
  userCheckCriminalFromVr,
};
