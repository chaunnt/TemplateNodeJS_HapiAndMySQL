/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const { VEHICLE_PLATE_TYPE } = require('../../API/AppUserVehicle/AppUserVehicleConstant');
const { reportToTelegram } = require('../TelegramBot/TelegramBotFunctions');
const SoapClient = require('./SoapClient');

const VR_VEHICLE_TYPE = {
  XE_CHO_NGUOI: 1, //- Xe chở người (ô tô con và ô tô khách)
  XE_CHO_HANG: 2, // 2- Xe chở hàng (ô tô tải)
  XE_DAU_KEO: 3, //3- Xe đầu kéo
  XE_CHUYEN_DUNG: 4, //4- Xe chuyên dùng
  RO_MOOC: 5, //5- Rơ-moóc, Sơ-mi Rơ-moóc
  XE_CO_DONG_CO: 6, //- Xe bốn bánh có động cơ
};

const CO_KINH_DOANH_VAN_TAI = 1;
const XE_NHO_HON_16_CHO_HOAC_1_TAN = 1;
const CO_PHAT_NGUOI = 1;
const CO_GIA_HAN_DANG_KIEM = 1;

async function _checkLicensePlate(licensePlates, certificateSeries) {
  return new Promise(async (resolve, reject) => {
    const regex = /^[A-Z]{2}-\d{7}$/;
    if (!regex.test(certificateSeries)) {
      return resolve(undefined);
    }

    const soapClient = await SoapClient.initClient();

    if (soapClient) {
      const args = { strBienDK: licensePlates, strSoGCN: certificateSeries };
      soapClient.GetTT4AppTTDK(args, function (err, result) {
        if (err) {
          reportToTelegram(`VRORGAPI GetTT4AppTTDK lỗi API ${JSON.stringify(args)}`);
          reportToTelegram(err);
          return resolve({ data: undefined, error: `VRORGAPI GetTT4AppTTDK lỗi API ${JSON.stringify(args)}` });
        } else {
          const data = result.GetTT4AppTTDKResult;
          console.info(`data: ${data}`);
          switch (data) {
            case 'NoPermission':
              reportToTelegram(`VRORGAPI GetTT4AppTTDK NoPermission ${JSON.stringify(args)}`);
              return resolve({ data: undefined, error: `VRORGAPI GetTT4AppTTDK NoPermission ${JSON.stringify(args)}` });
            case 'InvalidInput':
              reportToTelegram(`VRORGAPI GetTT4AppTTDK InvalidInput ${JSON.stringify(args)}`);
              return resolve({ data: undefined, error: `VRORGAPI GetTT4AppTTDK InvalidInput ${JSON.stringify(args)}` });
            case 'NoData':
              //khong can theo doi nua
              // reportToTelegram(`VRORGAPI GetTT4AppTTDK NoData ${JSON.stringify(args)}`);
              return resolve({ data: undefined, error: `VRORGAPI GetTT4AppTTDK NoData ${JSON.stringify(args)}` });
            default:
              // data response: loại xe, ngày hết hạn, biển kinh doanh, xe nhỏ (<16 chỗ), phạt nguội, gia hạn
              const dataArray = data.split(';');
              const vehicleType = dataArray[0] * 1;
              const certificateExpiration = dataArray[1];
              const coKinhDoanhVanTai = dataArray[2] === 'True' ? CO_KINH_DOANH_VAN_TAI : 0;
              const xeNho = dataArray[3] === 'True' ? XE_NHO_HON_16_CHO_HOAC_1_TAN : 0;
              const criminal = dataArray[4] === 'True' ? CO_PHAT_NGUOI : 0;
              const extendLicense = dataArray[5] === 'True' ? CO_GIA_HAN_DANG_KIEM : 0;

              // reportToTelegram(`VRORGAPI GetTT4AppTTDK ${JSON.stringify(args)} data ===> ${JSON.stringify(dataArray)}`);
              return resolve({
                data: {
                  vehicleType,
                  certificateExpiration,
                  coKinhDoanhVanTai,
                  xeNho,
                  criminal,
                  extendLicense,
                },
              });
          }
        }
      });
    } else {
      reportToTelegram('VRORGAPI connect failed !');
      return resolve({ data: undefined, error: `VRORGAPI connect failed` });
    }
  });
}

async function doubleCheckLicensePlate(licensePlates, certificateSeries, plateColor = 'T') {
  let vrOutput = await _checkLicensePlate(licensePlates, certificateSeries, plateColor);
  if ((vrOutput === undefined || vrOutput.data === undefined) && plateColor === 'X') {
    let _licensePlateSubmiting = licensePlates + 'X';
    vrOutput = await _checkLicensePlate(_licensePlateSubmiting, certificateSeries);
  }
  return vrOutput;
}

module.exports = {
  doubleCheckLicensePlate,
  VR_VEHICLE_TYPE,
  XE_NHO_HON_16_CHO_HOAC_1_TAN,
};
