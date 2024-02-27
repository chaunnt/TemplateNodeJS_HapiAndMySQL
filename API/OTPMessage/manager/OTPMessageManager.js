/* Copyright (c) 2022-2023 Reminano */

'use strict';

const moment = require('moment');
require('dotenv').config();
const Logger = require('../../../utils/logging');
const OTPMessageResourAccess = require('../resourceAccess/OTPMessageResourceAccess');
const { ERROR } = require('../../Common/CommonConstant');
const {
  OTP_CONFIRM_STATUS,
  OTP_ERROR,
  OTP_MAX_CHARACTER,
  OTP_MAX_VALUE,
  OTP_MAX_LIMITED_REQUEST,
  OTP_TYPE,
  OTP_TITLE,
} = require('../OTPMessageConstant');
const { sendOTPToPhoneNumber, sendOTPToEmail, sendRegisterOTPToEmail } = require('../OTPMessageFunction');
const utilitiesFunction = require('../../ApiUtils/utilFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { USER_ERROR } = require('../../AppUsers/AppUserConstant');
const { getUserDeviceFromUserAgent } = require('../../AppUserDevices/AppUserDevicesFunctions');

async function isOTPExceedLimit(phoneNumber, otpType) {
  if (!otpType) {
    return false;
  }
  let _existingOTPList = await OTPMessageResourAccess.find(
    {
      id: phoneNumber,
      otpType: otpType,
    },
    0,
    10,
  );
  if (_existingOTPList && _existingOTPList.length >= OTP_MAX_LIMITED_REQUEST) {
    return true;
  }
  return false;
}

function otpErrorMessageByType(otpType) {
  if (otpType === OTP_TYPE.ADD_PAYMENT_METHOD_BANK) {
    return OTP_ERROR.MAX_COUNTER_ADD_PAYMENT_METHOD_BANK;
  }
  if (otpType === OTP_TYPE.FORGOT_SECONDARY_PASSWORD) {
    return OTP_ERROR.MAX_COUNTER_FORGOT_SECONDARY_PASSWORD;
  }
  if (otpType === OTP_TYPE.FORGOT_PASSWORD) {
    return OTP_ERROR.MAX_COUNTER_FORGOT_PASSWORD;
  }
  if (otpType === OTP_TYPE.ADD_PAYMENT_METHOD_CRYPTO) {
    return OTP_ERROR.MAX_COUNTER_ADD_PAYMENT_METHOD_CRYPTO;
  }
  return '';
}

async function userRequestPhoneOTPRegister(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.phoneNumber;
      //kiem tra OTP bi trung lap
      let _isOTPExceedLimit = await isOTPExceedLimit(id, req.payload.otpType);

      const userAgent = req.headers['user-agent'];
      let _userDevice = getUserDeviceFromUserAgent(userAgent);
      if (
        utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceName) &&
        // utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceBrand) &&
        utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceType)
      ) {
        resolve('register ok');
      }

      if (_isOTPExceedLimit) {
        return reject(otpErrorMessageByType(req.payload.otpType));
      }

      //kiem tra user bi trung lap
      let _isExistingPhoneNumber = await AppUsersResourceAccess.find({
        phoneNumber: id,
      });
      if (_isExistingPhoneNumber && _isExistingPhoneNumber.length > 0) {
        return reject(USER_ERROR.DUPLICATED_USER);
      }

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );

      let newOTP = OTP_MAX_VALUE;
      if (process.env.SMS_ENABLE * 1 === 1) {
        newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);
        newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);
      }

      if (_existingOTPList && _existingOTPList.length > 0) {
        for (let i = 0; i < _existingOTPList.length; i++) {
          const _otpData = _existingOTPList[i];
          await OTPMessageResourAccess.updateById(_otpData.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
          });
        }
      }
      //store IP & last login
      const requestIp = require('request-ip');
      const clientIp = requestIp.getClientIp(req);
      let storeResult = await OTPMessageResourAccess.insert({
        id: id,
        otp: newOTP,
        expiredTime: 10,
        otpType: req.payload.otpType || null,
        clientIp: clientIp || null,
      });

      if (!storeResult) {
        Logger.error(OTP_ERROR.CAN_NOT_STORE_OTP);
        return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
      }

      if (process.env.STRINGEE_OTP_ENABLE * 1 === 1) {
        let otpResult = await sendOTPToPhoneNumber(id, newOTP);
        if (!otpResult) {
          Logger.error(OTP_ERROR.SEND_OTP_FAILED);
          return reject(OTP_ERROR.SEND_OTP_FAILED);
        }
      } else {
        //use Alenba SMS API
        const AlenbaSMSAPI = require('../../../ThirdParty/AlenbaSMSAPI/AlenbaSMSAPI');
        let otpResult = await AlenbaSMSAPI.sendOTPBySMSToPhoneNumber(id, newOTP);
        if (!otpResult) {
          Logger.error(`sendOTPBySMSToPhoneNumber ` + OTP_ERROR.SEND_OTP_FAILED);
          return reject(OTP_ERROR.SEND_OTP_FAILED);
        }
      }

      resolve('success');
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`);
      Logger.error(e);
      reject('failed');
    }
  });
}
async function userRequestEmailOTPRegister(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.email;
      //kiem tra user bi trung lap
      let _isExistingEmail = await AppUsersResourceAccess.find({
        email: id,
      });
      if (_isExistingEmail && _isExistingEmail.length > 0) {
        return reject(USER_ERROR.DUPLICATED_USER_EMAIL);
      }
      //kiem tra OTP bi trung lap
      let _isOTPExceedLimit = await isOTPExceedLimit(id, req.payload.otpType);

      const userAgent = req.headers['user-agent'];
      let _userDevice = getUserDeviceFromUserAgent(userAgent);
      if (
        utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceName) &&
        // utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceBrand) &&
        utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceType)
      ) {
        resolve('register ok');
      }

      if (_isOTPExceedLimit) {
        return reject(otpErrorMessageByType(req.payload.otpType));
      }

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );

      let newOTP = OTP_MAX_VALUE;
      if (process.env.ENABLE_EMAIL_OTP * 1 === 1) {
        newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);
        newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);
      }

      if (_existingOTPList && _existingOTPList.length > 0) {
        for (let i = 0; i < _existingOTPList.length; i++) {
          const _otpData = _existingOTPList[i];
          await OTPMessageResourAccess.updateById(_otpData.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
          });
        }
      }
      //store IP & last login
      const requestIp = require('request-ip');
      const clientIp = requestIp.getClientIp(req);

      let storeResult = await OTPMessageResourAccess.insert({
        id: id,
        otp: newOTP,
        expiredTime: 30,
        otpType: req.payload.otpType || null,
        clientIp: clientIp,
      });

      if (!storeResult) {
        Logger.error(OTP_ERROR.CAN_NOT_STORE_OTP);
        return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
      }

      let otpResult = await sendRegisterOTPToEmail(id, newOTP);
      if (!otpResult) {
        Logger.error(OTP_ERROR.SEND_OTP_FAILED);
        return reject(OTP_ERROR.SEND_OTP_FAILED);
      }

      resolve('success');
    } catch (e) {
      Logger.error(`error userRequestEmailOTPRegister`);
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userRequestPhoneOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.phoneNumber;
      let _isOTPExceedLimit = await isOTPExceedLimit(id, req.payload.otpType);
      if (_isOTPExceedLimit) {
        return reject(otpErrorMessageByType(req.payload.otpType));
      }

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );

      let newOTP = OTP_MAX_VALUE;
      if (process.env.SMS_ENABLE * 1 === 1) {
        newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);
        newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);
      }

      if (_existingOTPList && _existingOTPList.length > 0) {
        for (let i = 0; i < _existingOTPList.length; i++) {
          const _otpData = _existingOTPList[i];
          await OTPMessageResourAccess.updateById(_otpData.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
          });
        }
      }
      const requestIp = require('request-ip');
      const clientIp = requestIp.getClientIp(req);
      let storeResult = await OTPMessageResourAccess.insert({
        id: id,
        otp: newOTP,
        expiredTime: 10,
        otpType: req.payload.otpType || null,
        clientIp: clientIp || null,
      });

      if (!storeResult) {
        Logger.error(OTP_ERROR.CAN_NOT_STORE_OTP);
        return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
      }

      if (process.env.STRINGEE_OTP_ENABLE * 1 === 1) {
        let otpResult = await sendOTPToPhoneNumber(id, newOTP);
        if (!otpResult) {
          Logger.error(OTP_ERROR.SEND_OTP_FAILED);
          return reject(OTP_ERROR.SEND_OTP_FAILED);
        }
      } else {
        //use Alenba SMS API
        const AlenbaSMSAPI = require('../../../ThirdParty/AlenbaSMSAPI/AlenbaSMSAPI');
        let otpResult = await AlenbaSMSAPI.sendOTPBySMSToPhoneNumber(id, newOTP);
        if (!otpResult) {
          Logger.error(`sendOTPBySMSToPhoneNumber ` + OTP_ERROR.SEND_OTP_FAILED);
          return reject(OTP_ERROR.SEND_OTP_FAILED);
        }
      }

      resolve('success');
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`);
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userRequestPhoneUsernameOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.phoneNumber;

      let _isOTPExceedLimit = await isOTPExceedLimit(id, req.payload.otpType);
      if (_isOTPExceedLimit) {
        return reject(otpErrorMessageByType(req.payload.otpType));
      }

      let newOTP = OTP_MAX_VALUE;
      if (process.env.SMS_ENABLE * 1 === 1) {
        newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);
        newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);
      }

      let _existingUser = await AppUsersResourceAccess.find({
        username: req.payload.username,
        phoneNumber: req.payload.phoneNumber,
      });

      if (!_existingUser || _existingUser.length <= 0) {
        //Tên người dùng hoặc số điện thoại không đúng"
        Logger.error('Tên người dùng hoặc số điện thoại không đúng');
        return reject('MISMATCH_PHONE_AND_USERNAME');
      }

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        for (let i = 0; i < _existingOTPList.length; i++) {
          const _otpData = _existingOTPList[i];
          await OTPMessageResourAccess.updateById(_otpData.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
          });
        }
      }
      const requestIp = require('request-ip');
      const clientIp = requestIp.getClientIp(req);
      let storeResult = await OTPMessageResourAccess.insert({
        id: id,
        otp: newOTP,
        expiredTime: 10,
        otpType: req.payload.otpType || null,
        clientIp: clientIp || null,
      });

      if (!storeResult) {
        Logger.error(OTP_ERROR.CAN_NOT_STORE_OTP);
        return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
      }

      if (process.env.STRINGEE_OTP_ENABLE * 1 === 1) {
        let otpResult = await sendOTPToPhoneNumber(id, newOTP);
        if (!otpResult) {
          Logger.error(OTP_ERROR.SEND_OTP_FAILED);
          return reject(OTP_ERROR.SEND_OTP_FAILED);
        }
      } else {
        //use Alenba SMS API
        const AlenbaSMSAPI = require('../../../ThirdParty/AlenbaSMSAPI/AlenbaSMSAPI');
        let otpResult = await AlenbaSMSAPI.sendOTPBySMSToPhoneNumber(id, newOTP);
        if (!otpResult) {
          Logger.error(OTP_ERROR.SEND_OTP_FAILED);
          return reject(OTP_ERROR.SEND_OTP_FAILED);
        }
      }

      resolve('success');
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}
// Lấy lại mật khẩu đăng nhập
async function userRequestEmailUsernameOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.email;

      let _isOTPExceedLimit = await isOTPExceedLimit(id, req.payload.otpType);
      if (_isOTPExceedLimit) {
        return reject(otpErrorMessageByType(req.payload.otpType));
      }

      let newOTP = OTP_MAX_VALUE;
      if (process.env.ENABLE_EMAIL_OTP * 1 === 1) {
        newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);
        newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);
      }

      let _existingUser = await AppUsersResourceAccess.find({
        username: req.payload.username,
        email: req.payload.email,
      });

      if (!_existingUser || _existingUser.length <= 0) {
        //Tên người dùng hoặc số điện thoại không đúng"
        Logger.error('Tên người dùng hoặc email không đúng');
        return reject('MISMATCH_EMAIL_AND_USERNAME');
      }

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        for (let i = 0; i < _existingOTPList.length; i++) {
          const _otpData = _existingOTPList[i];
          await OTPMessageResourAccess.updateById(_otpData.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
          });
        }
      }
      const requestIp = require('request-ip');
      const clientIp = requestIp.getClientIp(req);
      let storeResult = await OTPMessageResourAccess.insert({
        id: id,
        otp: newOTP,
        expiredTime: 30,
        otpType: req.payload.otpType || null,
        clientIp: clientIp || null,
      });

      if (!storeResult) {
        Logger.error(OTP_ERROR.CAN_NOT_STORE_OTP);
        return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
      }

      let otpResult = await sendOTPToEmail(id, newOTP, OTP_TITLE.CHANGE_PASSWORD_LOGIN);
      if (!otpResult) {
        Logger.error(OTP_ERROR.SEND_OTP_FAILED);
        return reject(OTP_ERROR.SEND_OTP_FAILED);
      }

      resolve('success');
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}
async function userConfirmPhoneOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { otp, phoneNumber } = req.payload;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          otp: otp,
          id: phoneNumber,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];

        let otpDurationDiff = moment().diff(moment(_existingOTPList.createdAt), 'minute');
        if (otpDurationDiff > _existingOTPList.expiredTime) {
          await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
            confirmedAt: new Date(),
          });
          Logger.error(OTP_ERROR.OTP_EXPIRED);
          return reject(OTP_ERROR.OTP_EXPIRED);
        }

        let storeResult = await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
          confirmedAt: new Date(),
        });

        if (storeResult !== undefined) {
          return resolve('success');
        } else {
          Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
          return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
        }
      } else {
        Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
        return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
      }
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}
// Lấy lại mật khẩu giao dịch
async function userRequestEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.email;
      let otpType = req.payload.otpType;
      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );

      let newOTP = OTP_MAX_VALUE;
      if (process.env.ENABLE_EMAIL_OTP * 1 === 1) {
        newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);
        newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);
      }

      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];
        await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          otp: newOTP,
        });
      } else {
        const requestIp = require('request-ip');
        const clientIp = requestIp.getClientIp(req);

        let storeResult = await OTPMessageResourAccess.insert({
          id: id,
          otp: newOTP,
          expiredTime: 30,
          otpType: req.payload.otpType || null,
          clientIp: clientIp || null,
        });

        if (!storeResult) {
          Logger.error(OTP_ERROR.CAN_NOT_STORE_OTP);
          return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
        }
      }
      let otpTitle = '';
      if (otpType === OTP_TYPE.ADD_PAYMENT_METHOD_BANK) {
        otpTitle = OTP_TITLE.ADD_BANK_ACCOUNT;
      } else if (otpType === OTP_TYPE.ADD_PAYMENT_METHOD_CRYPTO) {
        otpTitle = OTP_TITLE.ADD_USDT_ACCOUNT;
      } else if (otpType === OTP_TYPE.FORGOT_SECONDARY_PASSWORD) {
        otpTitle = OTP_TITLE.CHANGE_PASSWORD_TRANSACTION;
      }
      let otpResult = await sendOTPToEmail(id, newOTP, otpTitle);
      if (!otpResult) {
        Logger.error(OTP_ERROR.SEND_OTP_FAILED);
        return reject(OTP_ERROR.SEND_OTP_FAILED);
      }

      resolve('success');
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

async function userConfirmEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { otp, email } = req.payload;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          otp: otp,
          id: email,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];

        let otpDurationDiff = moment().diff(moment(_existingOTPList.createdAt), 'minute');
        if (otpDurationDiff > _existingOTPList.expiredTime) {
          await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
            confirmedAt: new Date(),
          });
          Logger.error(OTP_ERROR.OTP_EXPIRED);
          return reject(OTP_ERROR.OTP_EXPIRED);
        }

        let storeResult = await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
          confirmedAt: new Date(),
        });

        if (storeResult !== undefined) {
          return resolve('success');
        } else {
          Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
          return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
        }
      } else {
        Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
        return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
      }
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

async function userConfirmEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { otp, email } = req.payload;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          otp: otp,
          id: email,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];

        let otpDurationDiff = moment().diff(moment(_existingOTPList.createdAt), 'minute');
        if (otpDurationDiff > _existingOTPList.expiredTime) {
          await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
            confirmedAt: new Date(),
          });
          Logger.error(OTP_ERROR.OTP_EXPIRED);
          return reject(OTP_ERROR.OTP_EXPIRED);
        }

        let storeResult = await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
          confirmedAt: new Date(),
        });

        if (storeResult !== undefined) {
          return resolve('success');
        } else {
          Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
          return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
        }
      } else {
        Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
        return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
      }
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

async function adminResetOTPLimit(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let phoneNumber = req.payload.phoneNumber;
      let otpType = req.payload.otpType;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: phoneNumber,
          otpType: otpType,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        for (let i = 0; i < _existingOTPList.length; i++) {
          const _otpData = _existingOTPList[i];
          await OTPMessageResourAccess.deleteById(_otpData.otpMessageId);
        }
      }
      return resolve('success');
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

async function _getUserLimitOTPByType(phoneNumber, otpType) {
  let _otpCounter = await OTPMessageResourAccess.count({
    id: phoneNumber,
    otpType: otpType,
  });
  if (_otpCounter && _otpCounter.length > 0) {
    return _otpCounter[0].count;
  } else {
    return 0;
  }
}
async function adminGetUserOTPLimit(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let phoneNumber = req.payload.phoneNumber;
      let _counterOTPByTypes = await Promise.all([
        _getUserLimitOTPByType(phoneNumber, OTP_TYPE.FORGOT_PASSWORD),
        _getUserLimitOTPByType(phoneNumber, OTP_TYPE.FORGOT_SECONDARY_PASSWORD),
        _getUserLimitOTPByType(phoneNumber, OTP_TYPE.ADD_PAYMENT_METHOD_BANK),
        _getUserLimitOTPByType(phoneNumber, OTP_TYPE.ADD_PAYMENT_METHOD_CRYPTO),
      ]);
      let output = {};
      for (let i = 0; i < Object.keys(OTP_TYPE).length; i++) {
        output[Object.keys(OTP_TYPE)[i]] = _counterOTPByTypes[i];
        if (i >= 3) {
          break;
        }
      }
      return resolve(output);
    } catch (e) {
      Logger.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

module.exports = {
  userRequestEmailOTPRegister,
  userRequestEmailUsernameOTP,
  userRequestPhoneUsernameOTP,
  userRequestPhoneOTPRegister,
  userRequestPhoneOTP,
  userConfirmPhoneOTP,
  userRequestEmailOTP,
  userConfirmEmailOTP,
  adminResetOTPLimit,
  adminGetUserOTPLimit,
};
