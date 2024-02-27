/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SMSMessageResourceAccess = require('./resourceAccess/SMSMessageResourceAccess');
const LogSMSResourceAccess = require('./resourceAccess/LogSMSResourceAccess');

async function addNewSMSMessage(smsData) {
  console.info(smsData);
  let existingSMSMessage = await SMSMessageResourceAccess.insert(smsData);
  return existingSMSMessage;
}

async function addNewLogSMSMessage(logData) {
  let newLogSMS = await LogSMSResourceAccess.insert(logData);
  return newLogSMS;
}

function isOTPSMSMessage(message) {
  if (message) {
    if (message.toUpperCase().indexOf('TTDK_OTP') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK') >= 0 && message.toUpperCase().indexOf('OTP') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK_KICH_HOAT') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK') >= 0 && message.toUpperCase().indexOf('KICH') >= 0 && message.toUpperCase().indexOf('HOAT') >= 0) {
      return true;
    }
  }
  return false;
}

function isResetPasswordSMSMessage(message) {
  if (message) {
    if (message.toUpperCase().indexOf('TTDK_MATKHAU') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK') >= 0 && message.toUpperCase().indexOf('MATKHAU') >= 0) {
      return true;
    }
  }
  return false;
}

function isSMSBookingSchedule(message) {
  let isScheduleSMS = -1; // Không phải SMS đặt lịch

  if (message) {
    // 2004D 59F12345 06/12/2023
    if (message.toUpperCase().split(' ').length === 3) {
      isScheduleSMS = 1;
    }

    // TTDK 2004D dat lich 59A12345 06/13/2023
    if (message.toUpperCase().indexOf('TTDK') >= 0 && message.toUpperCase().indexOf('DAT') >= 0 && message.toUpperCase().indexOf('LICH') >= 0) {
      return 2;
    }

    //  TTDK_HEN 2004D 59F12345 06/12/2023
    if (message.toUpperCase().indexOf('TTDK_HEN') >= 0) {
      return 3;
    }
  }

  return isScheduleSMS;
}

module.exports = {
  addNewSMSMessage,
  isOTPSMSMessage,
  isResetPasswordSMSMessage,
  isSMSBookingSchedule,
  addNewLogSMSMessage,
};
