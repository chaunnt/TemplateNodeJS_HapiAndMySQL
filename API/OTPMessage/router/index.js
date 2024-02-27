/* Copyright (c) 2022-2023 Reminano */

const OTPMessageRouter = require('./OTPMessageRouter');

module.exports = [
  { method: 'POST', path: '/OTPMessage/adminResetOTPLimit', config: OTPMessageRouter.adminResetOTPLimit },
  { method: 'POST', path: '/OTPMessage/adminGetUserOTPLimit', config: OTPMessageRouter.adminGetUserOTPLimit },
  { method: 'POST', path: '/OTPMessage/user/requestPhoneOTPRegister', config: OTPMessageRouter.userRequestPhoneOTPRegister },
  { method: 'POST', path: '/OTPMessage/user/requestEmailOTPRegister', config: OTPMessageRouter.userRequestEmailOTPRegister },
  { method: 'POST', path: '/OTPMessage/user/requestPhoneOTP', config: OTPMessageRouter.userRequestPhoneOTP },
  { method: 'POST', path: '/OTPMessage/user/requestPhoneUsernameOTP', config: OTPMessageRouter.userRequestPhoneUsernameOTP },
  { method: 'POST', path: '/OTPMessage/user/requestEmailUsernameOTP', config: OTPMessageRouter.userRequestEmailUsernameOTP },
  { method: 'POST', path: '/OTPMessage/user/confirmPhoneOTP', config: OTPMessageRouter.userConfirmPhoneOTP },
  { method: 'POST', path: '/OTPMessage/user/requestEmailOTP', config: OTPMessageRouter.userRequestEmailOTP },
  { method: 'POST', path: '/OTPMessage/user/confirmEmailOTP', config: OTPMessageRouter.userConfirmEmailOTP },
];
