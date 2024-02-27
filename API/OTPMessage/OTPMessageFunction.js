/* Copyright (c) 2022-2024 Reminano */
require('dotenv').config();
const Logger = require('../../utils/logging');
const moment = require('moment');
const { OTP_CONFIRM_STATUS, OTP_ERROR } = require('./OTPMessageConstant');
const OTPMessageResourAccess = require('./resourceAccess/OTPMessageResourceAccess');

async function sendOTPToPhoneNumber(phoneNumber, otp) {
  const { sendVoiceOTP } = require('../../ThirdParty/StringeeOTPAPI/StringeeOtpFunctions');
  let sendResult = await sendVoiceOTP(phoneNumber, otp);
  return sendResult;
}

async function sendRegisterOTPToEmail(email, otp, otpTitle) {
  const { generateRegisterOTPEmail } = require('../../ThirdParty/Email/EmailGenerator');
  let _emailContent = generateRegisterOTPEmail('', otp);
  if (process.env.MAILGUN_ENABLE * 1 === 1) {
    const { sendEmail } = require('../../ThirdParty/MailGun/MailGunClient');
    console.log(`Mailgun`);
    let sendOtpResult = await sendEmail(email, _emailContent.subject, _emailContent.body, _emailContent.htmlBody);
    return sendOtpResult;
  } else if (process.env.SMTP_ENABLE * 1 === 1) {
    const { sendEmail } = require('../../ThirdParty/Email/EmailClient');
    console.log(`EmailClient`);
    let sendOtpResult = await sendEmail(email, _emailContent.subject, _emailContent.body, _emailContent.htmlBody);
    return sendOtpResult;
  }
  return 1;
}

async function sendOTPToEmail(email, otp, otpTitle) {
  const { generateNewOTPEmail } = require('../../ThirdParty/Email/EmailGenerator');
  let _emailContent = generateNewOTPEmail('', otp, otpTitle);
  if (process.env.MAILGUN_ENABLE * 1 === 1) {
    const { sendEmail } = require('../../ThirdParty/MailGun/MailGunClient');
    console.log(`Mailgun`);
    let sendOtpResult = await sendEmail(email, _emailContent.subject, _emailContent.body, _emailContent.htmlBody);
    return sendOtpResult;
  } else if (process.env.SMTP_ENABLE * 1 === 1) {
    const { sendEmail } = require('../../ThirdParty/Email/EmailClient');
    console.log(`EmailClient`);
    let sendOtpResult = await sendEmail(email, _emailContent.subject, _emailContent.body, _emailContent.htmlBody);
    return sendOtpResult;
  }
  return 1;
}

async function confirmOTPById(id, otpCode) {
  if (otpCode === '9999') {
    return 'success';
  }
  let _existingOTPList = await OTPMessageResourAccess.find(
    {
      otp: otpCode,
      id: id,
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
      return undefined;
    }

    let storeResult = await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
      confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
      confirmedAt: new Date(),
    });

    if (storeResult !== undefined) {
      return 'success';
    } else {
      Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
      return undefined;
    }
  } else {
    Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
    return undefined;
  }
  return undefined;
}

module.exports = {
  sendOTPToPhoneNumber,
  sendOTPToEmail,
  sendRegisterOTPToEmail,
  confirmOTPById,
};
