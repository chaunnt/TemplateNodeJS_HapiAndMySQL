/* Copyright (c) 2021-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'AppUsers';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const Maintain = require('../../Common/route/response').maintain();
const CommonFunctions = require('../../Common/CommonFunctions');
const AppUsersFunctions = require('../AppUsersFunctions');
const { USER_SEX, USER_TYPE, USER_BLOCK_ACTION } = require('../AppUserConstant');
const { MAINTAIN_ERROR } = require('../../Common/CommonConstant');
const { OTP_MAX_CHARACTER } = require('../../OTPMessage/OTPMessageConstant');
const { getSystemStatus } = require('../../Maintain/MaintainFunctions');
const insertSchema = {
  lastName: Joi.string().max(255),
  firstName: Joi.string().max(255),
  username: Joi.string().alphanum().min(4).max(30).required(),
  email: Joi.string().email().max(255),
  referUser: Joi.string().allow('').max(100),
  password: Joi.string().required().min(6),
  secondaryPassword: Joi.string().min(6),
  phoneNumber: Joi.string().min(9).max(15),
  birthDay: Joi.string().max(255),
  identityNumber: Joi.string().max(255),
  sex: Joi.number().min(USER_SEX.MALE).max(USER_SEX.FEMALE),
  companyName: Joi.string().max(255),
  userHomeAddress: Joi.string().max(255),
  province: Joi.string(),
  district: Joi.string(),
  ward: Joi.string(),
  address: Joi.string(),
  referCode: Joi.string(),
};
const updateSchema = {
  lastName: Joi.string().allow(''),
  firstName: Joi.string().allow(''),
  phoneNumber: Joi.string(),
  email: Joi.string().email(),
  birthDay: Joi.string().allow(''),
  active: Joi.number().min(0).max(1),
  blockedLogin: Joi.number().min(0).max(5),
  blockedWithdrawBank: Joi.number().min(0).max(5),
  blockedWithdrawCrypto: Joi.number().min(0).max(5),
  limitWithdrawDaily: Joi.number().min(0).max(1000000000),
  memberLevelName: Joi.string(),
  twoFACode: Joi.string(),
  twoFAEnable: Joi.number().min(0).max(1),
  userAvatar: Joi.string().allow(''),
  identityNumber: Joi.string(),
  sex: Joi.number().min(USER_SEX.MALE).max(USER_SEX.FEMALE),
  firebaseToken: Joi.string(),
  telegramId: Joi.string(),
  isDeleted: Joi.number(),
  sotaikhoan: Joi.string().allow(['', null]),
  tentaikhoan: Joi.string().allow(['', null]),
  tennganhang: Joi.string().allow(['', null]),
  diachiviUSDT: Joi.string().allow(['', null]),
  diachiviBTC: Joi.string().allow(['', null]),
  companyName: Joi.string(),
  province: Joi.string(),
  district: Joi.string(),
  ward: Joi.string(),
  address: Joi.string(),
  isAllowedWithdraw: Joi.number(),
};

const filterSchema = {
  active: Joi.number().min(0).max(100),
  isExpert: Joi.number(),
  appUserMembershipId: Joi.number(),
  duplicatedIpAddress: Joi.number(),
  duplicatedFirstLoginIp: Joi.number(),
  blockedLogin: Joi.number(),
  blockedWithdrawBank: Joi.number(),
  isAllowedWithdraw: Joi.number(),
};

module.exports = {
  insert: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'insert');
    },
  },
  updateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object({
          ...updateSchema,
          appUserMembershipId: Joi.number().min(0),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  find: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  findById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
  adminUnblockLoginUser: {
    tags: ['api', `${moduleName}`],
    description: `unblock user login ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().required().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminUnblockLoginUser');
    },
  },
  adminUnblockWithdrawBank: {
    tags: ['api', `${moduleName}`],
    description: `unblock user withdraw with bank ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().required().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminUnblockWithDrawBank');
    },
  },
  adminUnblockWithdrawCrypto: {
    tags: ['api', `${moduleName}`],
    description: `unblock user withdraw with crypto ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().required().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminUnblockWithDrawCrypto');
    },
  },
  loginUser: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        username: Joi.string().alphanum().min(4).max(30).required(),
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginUser');
    },
  },
  loginByPhone: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        phoneNumber: Joi.string().alphanum().min(6).max(30).required(),
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginByPhone');
    },
  },
  loginByToken: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        token: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginByToken');
    },
  },
  loginByEmail: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().email().min(6).max(30).required(),
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginByEmail');
    },
  },
  loginFacebook: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        facebook_id: Joi.string().required(),
        facebook_avatar: Joi.string(),
        facebook_name: Joi.string(),
        facebook_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginFacebook');
    },
  },
  loginGoogle: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        google_id: Joi.string().required(),
        google_avatar: Joi.string(),
        google_name: Joi.string(),
        google_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginGoogle');
    },
  },
  loginZalo: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        zalo_id: Joi.string().required(),
        zalo_avatar: Joi.string(),
        zalo_name: Joi.string(),
        zalo_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginZalo');
    },
  },
  loginApple: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        apple_id: Joi.string().required(),
        apple_avatar: Joi.string(),
        apple_name: Joi.string(),
        apple_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signin === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGN_IN, res);
        return;
      }
      Response(req, res, 'loginApple');
    },
  },
  registerUser: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        ...insertSchema,
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'registerUser');
    },
  },
  registerUserWithOTP: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        ...insertSchema,
        otp: Joi.string().min(OTP_MAX_CHARACTER).required().max(10),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'registerUserWithOTP');
    },
  },
  checkUserName: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        username: Joi.string().min(4).max(30).required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'checkUserName');
    },
  },
  registerUserByStaffCode: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        ...insertSchema,
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'registerUserByStaffCode');
    },
  },
  registerUserByPhone: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        password: Joi.string().required().min(6),
        phoneNumber: Joi.string().required().max(15),
        companyName: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'registerUserByPhone');
    },
  },
  registerUserByEmail: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        referCode: Joi.string().allow('').max(100),
        referUser: Joi.string().allow(''),
        secondaryPassword: Joi.string().min(6),
        password: Joi.string().required().min(6),
        email: Joi.string().required().email(),
        companyName: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'registerUserByEmail');
    },
  },
  forgotPassword: {
    tags: ['api', `${moduleName}`],
    description: `user forgot ${moduleName}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().email().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().forgotPassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_FORGOT_PASSWORD, res);
        return;
      }
      Response(req, res, 'forgotPassword');
    },
  },
  forgotPasswordEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `user forgot ${moduleName}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().required().max(255),
        newPassword: Joi.string().required().min(6),
        otpCode: Joi.string().required().max(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().forgotPassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_FORGOT_PASSWORD, res);
        return;
      }
      Response(req, res, 'forgotPasswordEmailOTP');
    },
  },
  forgotPasswordSMSOTP: {
    tags: ['api', `${moduleName}`],
    description: `user forgot ${moduleName}`,
    validate: {
      payload: Joi.object({
        otpCode: Joi.string().required().max(6),
        username: Joi.string().min(4).max(30).required(),
        phoneNumber: Joi.string().required(),
        newPassword: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().forgotPassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_FORGOT_PASSWORD, res);
        return;
      }
      Response(req, res, 'forgotPasswordSMSOTP');
    },
  },
  forgotSecondaryPasswordSMSOTP: {
    tags: ['api', `${moduleName}`],
    description: `user forgot ${moduleName}`,
    validate: {
      payload: Joi.object({
        otpCode: Joi.string().required().max(6),
        phoneNumber: Joi.string().required(),
        newPassword: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().forgotPassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_FORGOT_PASSWORD, res);
        return;
      }
      Response(req, res, 'forgotSecondaryPasswordSMSOTP');
    },
  },
  forgotSecondaryPasswordEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `forgotSecondaryPasswordEmailOTP ${moduleName}`,
    validate: {
      payload: Joi.object({
        otpCode: Joi.string().required().max(6),
        email: Joi.string().required(),
        newPassword: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().forgotPassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_FORGOT_PASSWORD, res);
        return;
      }
      Response(req, res, 'forgotSecondaryPasswordEmailOTP');
    },
  },
  verifyEmailUser: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} verify email`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'verifyEmailUser');
    },
  },
  changePasswordUser: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required(),
        newPassword: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().changePassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_CHANGE_PASSWORD, res);
        return;
      }
      Response(req, res, 'changePasswordUser');
    },
  },
  verify2FA: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    validate: {
      payload: Joi.object({
        otpCode: Joi.string().required(),
        id: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'verify2FA');
    },
  },
  get2FACode: {
    tags: ['api', `${moduleName}`],
    description: `get QrCode for 2FA ${moduleName}`,
    validate: {
      query: {
        appUserId: Joi.number(),
      },
    },
    handler: function (req, res) {
      if (req.query.appUserId) {
        AppUsersFunctions.generate2FACode(req.query.appUserId).then(qrCode => {
          if (qrCode) {
            res.file(qrCode);
          } else {
            res('error').code(500);
          }
        });
      } else {
        res('error').code(500);
      }
    },
  },
  userUpdateInfo: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} update info`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required(),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateInfo');
    },
  },
  userGetDetailById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName} by id`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetailById');
    },
  },
  verifyInfoUser: {
    tags: ['api', `${moduleName}`],
    description: `Verify info ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'verifyInfoUser');
    },
  },

  rejectInfoUser: {
    tags: ['api', `${moduleName}`],
    description: `reject info ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        appUserNote: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'rejectInfoUser');
    },
  },
  blockUserBySupervisorId: {
    tags: ['api', `${moduleName}`],
    description: `blockUserBySupervisorId ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().min(0).required(),
        block: Joi.number().allow([USER_BLOCK_ACTION.BLOCK, USER_BLOCK_ACTION.UNBLOCK]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'blockUserBySupervisorId');
    },
  },
  getUsersByMonth: {
    tags: ['api', `${moduleName}`],
    description: `Get ${moduleName}s by month`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().required(),
        endDate: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getUsersByMonth');
    },
  },

  uploadIdentityCardBefore: {
    tags: ['api', `${moduleName}`],
    description: `upload identity card images for ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required().min(0),
        imageData: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    payload: {
      maxBytes: 10 * 1024 * 1024, //10 mb
      // output: 'file',
      parse: true,
      // allow: 'multipart/form-data',
      // multipart: {
      //     output: 'data',
      // }
    },
    handler: function (req, res) {
      Response(req, res, 'uploadBeforeIdentityCard');
    },
  },

  uploadIdentityCardAfter: {
    tags: ['api', `${moduleName}`],
    description: `upload identity card images for ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required().min(0),
        imageData: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    payload: {
      maxBytes: 10 * 1024 * 1024, //10 mb
      // output: 'file',
      parse: true,
      // allow: 'multipart/form-data',
      // multipart: {
      //     output: 'data',
      // }
    },
    handler: function (req, res) {
      Response(req, res, 'uploadAfterIdentityCard');
    },
  },

  userSubmitIdentity: {
    tags: ['api', `${moduleName}`],
    description: `user submit identity to admin`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userSubmitIdentity');
    },
  },
  uploadAvatar: {
    tags: ['api', `${moduleName}`],
    description: `upload avatar images for ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required().min(0),
        imageData: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    payload: {
      maxBytes: 10 * 1024 * 1024, //10 mb
      parse: true,
    },
    handler: function (req, res) {
      Response(req, res, 'uploadAvatar');
    },
  },

  exportExcelFile: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportExcel');
    },
  },

  resetPasswordBaseOnToken: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'resetPasswordBaseOnUserToken');
    },
  },
  resetPasswordBaseOnToken: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'resetPasswordBaseOnUserToken');
    },
  },
  adminResetPasswordUser: {
    tags: ['api', `${moduleName}`],
    description: `user forgot ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(1).required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().forgotPassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_FORGOT_PASSWORD, res);
        return;
      }
      Response(req, res, 'adminResetPassword');
    },
  },

  sendMailToVerify: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} verify email`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().required().email(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().signup === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_SIGNUP, res);
        return;
      }
      Response(req, res, 'sendMailToVerifyEmail');
    },
  },
  adminChangePasswordUser: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} adminChangePasswordUser`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(1).required(),
        password: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().changePassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_CHANGE_PASSWORD, res);
        return;
      }
      Response(req, res, 'adminChangePasswordUser');
    },
  },
  adminLockUser: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} adminLockUser`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(1).required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_ALL, res);
        return;
      }
      Response(req, res, 'adminLockUser');
    },
  },
  adminChangeSecondaryPasswordUser: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} adminChangeSecondaryPasswordUser`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(1).required(),
        password: Joi.string().required().min(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().changePassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_CHANGE_PASSWORD, res);
        return;
      }
      Response(req, res, 'adminChangeSecondaryPasswordUser');
    },
  },
  userViewsListMembership: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string(),
        startDate: Joi.string(),
        endDate: Joi.string(),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userViewsListMembership');
    },
  },
  findAllUsersFollowingReferId: {
    tags: ['api', `${moduleName}`],
    description: `get list ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          username: Joi.string(),
          firstName: Joi.string(),
          phoneNumber: Joi.string(),
          email: Joi.string(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100).min(1),
        searchText: Joi.string().max(255),
        order: Joi.object({
          key: Joi.string().max(255).default('createdAt').allow(''),
          value: Joi.string().max(255).default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findAllUsersFollowingReferId');
    },
  },
  userCheckExistingAccount: {
    tags: ['api', `${moduleName}`],
    description: `userCheckExistingAccount ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        username: Joi.string(),
        email: Joi.string().email(),
        phoneNumber: Joi.string(),
        companyName: Joi.string(),
        firstName: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCheckExistingAccount');
    },
  },
  confirmEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `confirm OTP on email ${moduleName}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_ALL, res);
        return;
      }
      Response(req, res, 'confirmEmailOTP');
    },
  },
  sendEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `send OTP on email ${moduleName}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().email().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_ALL, res);
        return;
      }
      Response(req, res, 'sendEmailOTP');
    },
  },
  changePasswordviaEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `changePasswordviaEmailOTP ${moduleName}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().email().required(),
        otpCode: Joi.string().required(),
        newPassword: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_ALL, res);
        return;
      }
      Response(req, res, 'changePasswordviaEmailOTP');
    },
  },
  userChangeSecondaryPassword: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} userChangeSecondaryPassword`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required().min(6),
        oldPassword: Joi.string().min(6),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false || getSystemStatus().changePassword === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_CHANGE_PASSWORD, res);
        return;
      }
      Response(req, res, 'userChangeSecondaryPassword');
    },
  },
  sendPhoneOTP: {
    tags: ['api', `${moduleName}`],
    description: `send OTP on phone ${moduleName}`,
    validate: {
      payload: Joi.object({
        phoneNumber: Joi.string().required().max(15),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_ALL, res);
        return;
      }
      Response(req, res, 'sendPhoneOTP');
    },
  },
  confirmPhoneOTP: {
    tags: ['api', `${moduleName}`],
    description: `confirm OTP on phone ${moduleName}`,
    validate: {
      payload: Joi.object({
        phoneNumber: Joi.string().required().max(15),
        otp: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_ALL, res);
        return;
      }
      Response(req, res, 'confirmPhoneOTP');
    },
  },
  userRequestUpgradeUser: {
    tags: ['api', `${moduleName}`],
    description: `buy agent rights ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestUpgradeUser');
    },
  },
  adminCreateVirtualUser: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    validate: {
      payload: Joi.object({
        ...insertSchema,
      }),
    },
    handler: function (req, res) {
      if (getSystemStatus().all === false) {
        Maintain(MAINTAIN_ERROR.MAINTAIN_ALL, res);
        return;
      }
      Response(req, res, 'adminCreateVirtualUser');
    },
  },
  adminBlockWithdrawal: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminBlockWithdrawal');
    },
  },
  adminUnblockWithdrawal: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminUnblockWithdrawal');
    },
  },
  adminBlockDeposit: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminBlockDeposit');
    },
  },
  adminUnblockDeposit: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminUnblockDeposit');
    },
  },
  adminAssignExpert: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminAssignExpert');
    },
  },
  adminUnassignExpert: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        appUserId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'adminUnassignExpert');
    },
  },
  resetWithdrawCountDay: {
    tags: ['api', `${moduleName}`],
    description: `resetWithdrawCountDay ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'resetWithdrawCountDay');
    },
  },
};
