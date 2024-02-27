/* Copyright (c) 2022-2023 Reminano */

'use strict';
const moduleName = 'OTPMessage';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { OTP_TYPE, OTP_MAX_CHARACTER } = require('../OTPMessageConstant');

module.exports = {
  userRequestPhoneUsernameOTP: {
    tags: ['api', `${moduleName}`],
    description: `userRequestPhoneUsernameOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(9).required().alphanum(),
        username: Joi.string().min(4).required().alphanum(),
        otpType: Joi.number().valid(Object.values(OTP_TYPE)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestPhoneUsernameOTP');
    },
  },
  userRequestEmailUsernameOTP: {
    tags: ['api', `${moduleName}`],
    description: `userRequestEmailUsernameOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().email().required(),
        username: Joi.string().min(4).required().alphanum(),
        otpType: Joi.number().valid(Object.values(OTP_TYPE)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestEmailUsernameOTP');
    },
  },
  userRequestPhoneOTPRegister: {
    tags: ['api', `${moduleName}`],
    description: `userRequestPhoneOTPRegister ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(9).required().alphanum(),
        otpType: Joi.number().valid(Object.values(OTP_TYPE)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestPhoneOTPRegister');
    },
  },
  userRequestEmailOTPRegister: {
    tags: ['api', `${moduleName}`],
    description: `userRequestEmailOTPRegister ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().email().required(),
        otpType: Joi.number().valid(Object.values(OTP_TYPE)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestEmailOTPRegister');
    },
  },
  userRequestPhoneOTP: {
    tags: ['api', `${moduleName}`],
    description: `userRequestPhoneOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(9).required().alphanum(),
        otpType: Joi.number().valid(Object.values(OTP_TYPE)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestPhoneOTP');
    },
  },
  userConfirmPhoneOTP: {
    tags: ['api', `${moduleName}`],
    description: `userConfirmPhoneOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(9).required().alphanum(),
        otp: Joi.string().min(OTP_MAX_CHARACTER).required().max(10),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userConfirmPhoneOTP');
    },
  },
  userRequestEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `userRequestEmailOTP ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().min(6).required().email(),
        otpType: Joi.number().min(0).valid(Object.values(OTP_TYPE)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestEmailOTP');
    },
  },
  userConfirmEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `userConfirmEmailOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().min(6).required().email(),
        otp: Joi.string().min(OTP_MAX_CHARACTER).required().max(10),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userConfirmEmailOTP');
    },
  },
  userConfirmEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `userConfirmEmailOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().min(6).required().email(),
        otp: Joi.string().min(OTP_MAX_CHARACTER).required().max(10),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userConfirmEmailOTP');
    },
  },
  adminResetOTPLimit: {
    tags: ['api', `${moduleName}`],
    description: `adminResetOTPLimit ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(6).required(),
        otpType: Joi.number().valid(Object.values(OTP_TYPE)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminResetOTPLimit');
    },
  },
  adminGetUserOTPLimit: {
    tags: ['api', `${moduleName}`],
    description: `adminGetUserOTPLimit ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(6).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminGetUserOTPLimit');
    },
  },
};
