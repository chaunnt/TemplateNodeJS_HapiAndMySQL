/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const AppUserMonthlyReportResourceAccess = require('../../AppUserMonthlyReport/resourceAccess/AppUserMonthlyReportResourceAccess');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
const AppUsersSettingResourceAccess = require('../resourceAccess/AppUsersSettingResourceAccess');
const AppUserView = require('../resourceAccess/AppUserView');
const AppUsersFunctions = require('../AppUsersFunctions');
const AppUserFunctions_ReferUser = require('../AppUserFunctions_ReferUser');
const TokenFunction = require('../../ApiUtils/token');
const utilitiesFunction = require('../../ApiUtils/utilFunctions');
const Logger = require('../../../utils/logging');
const UploadFunction = require('../../Upload/UploadFunctions');
const ERROR = require('../../Common/CommonConstant');
const WalletResourceAccess = require('../../Wallet/resourceAccess/WalletResourceAccess');
const WalletRecordFunction = require('../../WalletRecord/WalletRecordFunction');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const { WALLET_RECORD_TYPE } = require('../../WalletRecord/WalletRecordConstant');
const SummaryUserPaymentDepositTransactionView = require('../../PaymentDepositTransaction/resourceAccess/SummaryUserPaymentDepositTransactionView');
const SummaryUserWithdrawTransactionView = require('../../PaymentWithdrawTransaction/resourceAccess/SummaryUserWithdrawTransactionView');
const GamePlayRecordsView = require('../../GamePlayRecords/resourceAccess/GamePlayRecordsView');
const AppUserMembershipResourceAccess = require('../../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
const StaffUserResourceAccess = require('../../StaffUser/resourceAccess/StaffUserResourceAccess');
const { ROLE_NAME, PERMISSION_NAME } = require('../../StaffRole/StaffRoleConstants');
const { verifyStaffUser } = require('../../Common/CommonFunctions');
const PaymentBonusTransactionResourceAccess = require('../../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
const PaymentBonusTransactionReferUserView = require('../../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionReferUserView');
const {
  USER_VERIFY_INFO_STATUS,
  USER_VERIFY_EMAIL_STATUS,
  USER_VERIFY_PHONE_NUMBER_STATUS,
  USER_ERROR,
  USER_CATEGORY_ID,
  USER_CATEGORY,
  WITHDRAWAL_REQUEST,
  DEPOSIT_REQUEST,
  USER_BLOCK_ACTION,
  MAX_RESET_PASSWORD_LIMITED,
} = require('../AppUserConstant');
const { confirmOTPById } = require('../../OTPMessage/OTPMessageFunction');
const { changeUserSecondaryPassword } = require('../AppUsersFunctions');
const { OTP_ERROR, OTP_MAX_CHARACTER, OTP_MAX_VALUE, OTP_CONFIRM_STATUS } = require('../../OTPMessage/OTPMessageConstant');
const { LEVER_MEMBERSHIP, MAX_LEVEL_NUMBER } = require('../../AppUserMembership/AppUserMembershipConstant');
const { getMaxSystemUserLevelByMembership, getSystemUserLevelByMembershipId } = require('../../AppUserMembership/AppUserMembershipFunction');
const { REPORT_MONTH_DATA_FORMAT, REPORT_MONTH_DISPLAY_FORMAT } = require('../../AppUserMonthlyReport/AppUserMonthlyReportConstant');
const {
  getCachedTotalBetMissionAmountInByUser,
  getCachedTotalBetAmountInByUser,
  getAllBetRecordListByUser,
  getAllBetMissionRecordByUser,
} = require('../../GamePlayRecords/GamePlayRecordsFunctions');
const { isPlayGameRecordByType } = require('../../GameRecord/GameRecordFunctions');
const { BET_TYPE } = require('../../GamePlayRecords/GamePlayRecordsConstant');
const { calculateF1andAgent } = require('../../Staff/StaffFunctions');
const StaffResourceAccess = require('../../Staff/resourceAccess/StaffResourceAccess');
const { updateFirstWithdrawForUser } = require('../../PaymentWithdrawTransaction/manager/PaymentWithdrawTransactionManager');
const { DEPOSIT_TRX_STATUS } = require('../../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const { getUserDeviceFromUserAgent, saveUserDevice } = require('../../AppUserDevices/AppUserDevicesFunctions');
const AppUserMissionInfoResourceAccess = require('../../AppUserMission/resourceAccess/AppUserMissionInfoResourceAccess');
const OTPMessageResourceAccess = require('../../OTPMessage/resourceAccess/OTPMessageResourceAccess');
const { ACTION } = require('../../AppUserDevices/AppUserDevicesConstants');
const UserGamePlaysReportResourceAccess = require('../../GamePlayRecords/resourceAccess/UserGamePlaysReportResourceAccess');
const UserGamePlaysReportView = require('../../GamePlayRecords/resourceAccess/UserGamePlaysReportView');
const PaymentBonusDailyReportResourceAccess = require('../../PaymentBonusTransaction/resourceAccess/PaymentBonusDailyReportResourceAccess');
const PaymentBonusDailyReportView = require('../../PaymentBonusTransaction/resourceAccess/PaymentBonusDailyReportView');
const { logAdminUpdateAppUserData, logUserUpdateAppUserData } = require('../../SystemAppChangedLog/SystemAppLogAppUserFunctions');

async function _storeUserIp(req, appUser, token = '') {
  //store IP & last login
  const requestIp = require('request-ip');
  const clientIp = requestIp.getClientIp(req);
  let lastLogin = new Date().toISOString();
  const userAgent = req.headers['user-agent'];
  let _userDevice = getUserDeviceFromUserAgent(userAgent);
  let userDevice = `${_userDevice.deviceName}_${_userDevice.deviceType}_${_userDevice.deviceBrand}_${_userDevice.deviceModel}`;

  if (utilitiesFunction.isNotEmptyStringValue(clientIp)) {
    let _updateData = {
      lastActiveAt: lastLogin,
      token: token,
      blockedLogin: USER_BLOCK_ACTION.UNBLOCK, //reset so luot sai mat khau
      ipAddress: clientIp,
      userDevice: userDevice,
    };

    if (utilitiesFunction.isNotEmptyStringValue(appUser.firstLoginIp) === false) {
      _updateData.userFirstLoginDevice = userDevice;
      _updateData.firstLoginIp = clientIp;
      let _duplicatedFirstLoginIpUser = await AppUsersResourceAccess.find({ firstLoginIp: clientIp }, 0, 10);
      for (let i = 0; i < _duplicatedFirstLoginIpUser.length; i++) {
        if (_duplicatedFirstLoginIpUser[i].username !== appUser.username) {
          _updateData.duplicatedFirstLoginIp = 1;
          break;
        }
      }
    }

    let _duplicatedIpUser = await AppUsersResourceAccess.find({ ipAddress: clientIp }, 0, 10);
    if (_duplicatedIpUser && _duplicatedIpUser.length > 0) {
      for (let i = 0; i < _duplicatedIpUser.length; i++) {
        if (_duplicatedIpUser[i].username !== appUser.username) {
          _updateData.duplicatedIpAddress = 1;
          break;
        }
      }
    } else {
      _updateData.duplicatedIpAddress = 0;
    }

    if (utilitiesFunction.isNotEmptyStringValue(clientIp)) {
      await AppUsersResourceAccess.updateById(appUser.appUserId, _updateData);
      // Nếu đăng nhập IP trùng thì khóa nhiệm vụ và hoa hồng nhiệm vụ
      if (_updateData.duplicatedIpAddress || _updateData.duplicatedFirstLoginIp) {
        // await AppUserMissionInfoResourceAccess.updateById(appUser.appUserId, { enableAddMissionBonus: 0, enableMissionPlay: 0 });
      }
    }
  }
}

async function checkUserName(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const username = req.payload.username;
      let foundUser = await AppUsersResourceAccess.find({ username: username }, 0, 1);

      if (foundUser && foundUser.length > 0) {
        reject(USER_ERROR.DUPLICATED_USER);
      } else {
        resolve(`success`);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function _registerUser(req, userData, staffId) {
  return new Promise(async (resolve, reject) => {
    try {
      let newUser = await AppUsersFunctions.createNewUser(userData, staffId);
      if (newUser) {
        //tao vi cho user
        const WalletFunction = require('../../Wallet/WalletFunctions');
        await WalletFunction.createWalletForUser(newUser.appUserId);

        //tinh toan lai so luong F1 , chi nhanh cac thu cua dai ly
        if (utilitiesFunction.isValidValue(newUser.staffId)) {
          let _newStaffData = await calculateF1andAgent(newUser.staffId);
          await StaffResourceAccess.updateById(newUser.staffId, _newStaffData);
        }
        const userAgent = req.headers['user-agent'];
        await saveUserDevice(newUser.appUserId, userAgent, ACTION.REGISTER);
        resolve(newUser);
      } else {
        Logger.error(`error AppUserManage can not registerUser: `);
        reject('failed');
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(ERROR.POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(ERROR.UNKNOWN_ERROR);
      }
    }
  });
}
async function registerUserWithOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { otp, email } = req.payload;

      let _existingOTPList = await OTPMessageResourceAccess.find(
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
          await OTPMessageResourceAccess.updateById(_existingOTPList.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
            confirmedAt: new Date(),
          });
          Logger.error(OTP_ERROR.OTP_EXPIRED);
          return reject(OTP_ERROR.OTP_EXPIRED);
        }

        let storeResult = await OTPMessageResourceAccess.updateById(_existingOTPList.otpMessageId, {
          confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
          confirmedAt: new Date(),
        });
        if (storeResult !== undefined) {
          let userDataPayload = req.payload;
          let { otp, ...userData } = userDataPayload;
          await _registerUser(req, userData);
        } else {
          Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
          return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
        }
      } else {
        Logger.error(OTP_ERROR.CONFIRM_OTP_FAILED);
        return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.UNKNOWN_ERROR);
    }
  });
}
async function insert(req) {
  let userData = req.payload;
  return await _registerUser(req, userData);
}

async function registerUserByStaffCode(req) {
  let userData = req.payload;
  const StaffResourceAccess = require('../../Staff/resourceAccess/StaffResourceAccess');
  let referStaff = await StaffResourceAccess.find({ referCode: userData.referCode }, 0, 1);
  if (referStaff && referStaff.length > 0) {
    const newUser = await _registerUser(req, userData, referStaff[0].staffId);
    if (newUser) {
      await StaffUserResourceAccess.insert({
        appUserId: newUser.appUserId,
        staffId: referStaff[0].staffId,
      });
      return newUser;
    }
    return undefined;
  } else {
    throw USER_ERROR.REFER_USER_NOT_FOUND;
  }
}

async function _searchContactByCSKH(payload) {
  let filter = payload.filter || {};
  let skip = payload.skip;
  let limit = payload.limit;
  let order = payload.order;
  let searchText = payload.searchText;
  let startDate = payload.startDate;
  let endDate = payload.endDate;
  let _usernameFilter = JSON.parse(JSON.stringify(filter));
  _usernameFilter.username = searchText;
  let _phoneNumberFilter = JSON.parse(JSON.stringify(filter));
  _phoneNumberFilter.phoneNumber = searchText;

  searchText = undefined;

  let data = [];

  let userListFilterByUsername = await AppUserView.customSearch(_usernameFilter, skip, limit, startDate, endDate, searchText, order);
  if (userListFilterByUsername && userListFilterByUsername.length > 0) {
    for (let user of userListFilterByUsername) {
      user = await AppUsersFunctions.retrieveUserDetail(user.appUserId);
      delete user.token;
      data.push(user);
    }
  }

  let userListFilterByPhoneNumber = await AppUserView.customSearch(_phoneNumberFilter, skip, limit, startDate, endDate, searchText, order);
  if (userListFilterByPhoneNumber && userListFilterByPhoneNumber.length > 0) {
    for (let user of userListFilterByPhoneNumber) {
      user = await AppUsersFunctions.retrieveUserDetail(user.appUserId);
      delete user.token;
      data.push(user);
    }
  }

  return { data: data, total: data.length };
}
async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        filter.staffId = req.currentUser.staffId;
      }

      let users = await AppUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (users && users.length > 0) {
        for (let user of users) {
          let wallets = await WalletResourceAccess.find({ appUserId: user.appUserId });
          user.wallets = wallets;
        }
        let usersCount = await AppUserView.customCount(filter, startDate, endDate, searchText, order);
        resolve({ data: users, total: usersCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _existedUserEmail(userData) {
  if (userData.email) {
    let user = await AppUsersResourceAccess.find({ email: userData.email });
    if (user && user.length > 0) {
      return user[0];
    }
  }
  return undefined;
}

async function _existedUserPhoneNumber(userData) {
  if (userData.phoneNumber) {
    let user = await AppUsersResourceAccess.find({ phoneNumber: userData.phoneNumber });
    if (user && user.length > 0) {
      return user[0];
    }
  }
  return undefined;
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = req.payload.data;
      let appUserId = req.payload.id;

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }

      if (userData.firstName) {
        let _existedUsers = await AppUsersResourceAccess.find({ firstName: userData.firstName });
        if (_existedUsers && _existedUsers.length > 0 && _existedUsers[0].appUserId !== appUserId) {
          return reject(USER_ERROR.DUPLICATED_USER_FIRSTNAME);
        }
      }

      const existedPhoneUser = await _existedUserPhoneNumber(userData);
      if (existedPhoneUser) {
        if (existedPhoneUser.appUserId !== appUserId) {
          Logger.error(`error ${USER_ERROR.DUPLICATED_USER_PHONE} updateById failed`);
          reject(USER_ERROR.DUPLICATED_USER_PHONE);
          return; //always add "return" after reject / resolve to make sure everything will break
        }
      }

      const existedEmailUser = await _existedUserEmail(userData);
      if (existedEmailUser) {
        if (existedEmailUser.appUserId !== appUserId) {
          Logger.error(`error ${USER_ERROR.DUPLICATED_USER_EMAIL} updateById failed`);
          reject(USER_ERROR.DUPLICATED_USER_EMAIL);
          return; //always add "return" after reject / resolve to make sure everything will break
        }
      }

      if (userData.appUserMembershipId) {
        const membership = await AppUserMembershipResourceAccess.findById(userData.appUserMembershipId);
        if (membership) {
          userData.memberLevelName = membership.appUserMembershipTitle;
        }
      }
      let user = await AppUsersResourceAccess.findById(appUserId);
      let dataBefore = {};
      for (let i = 0; i < Object.keys(userData).length; i++) {
        const element = Object.keys(userData)[i];
        dataBefore[element] = user[element];
      }
      let updateResult = await AppUsersResourceAccess.updateById(appUserId, userData);
      if (updateResult) {
        await logAdminUpdateAppUserData(dataBefore, userData, req.currentUser, appUserId);
        // send message to user
        if (Object.keys(userData).indexOf('active') !== -1) {
          if (userData.active === 0) {
            // làm này để cho user thông báo biết đã bị khoá còn trăn trối
            if (process.env.GOOGLE_FIREBASE_PUSH_ENABLE) {
              const { APPROVE_USER_INFO, REFUSED_USER_INFO, USER_LOCKED, USER_ACTIVE } = require('../../CustomerMessage/CustomerMessageConstant');
              const { handleSendMessageUser } = require('../../CustomerMessage/CustomerMessageFunctions');
              handleSendMessageUser(USER_LOCKED, { time: moment().format('hh:mm DD/MM/YYYY') }, appUserId, {
                isForceLogout: true,
              });
            }
            AppUsersResourceAccess.updateById(appUserId, {
              active: userData.active,
            });
          } else {
            if (process.env.GOOGLE_FIREBASE_PUSH_ENABLE) {
              const { APPROVE_USER_INFO, REFUSED_USER_INFO, USER_LOCKED, USER_ACTIVE } = require('../../CustomerMessage/CustomerMessageConstant');
              const { handleSendMessageUser } = require('../../CustomerMessage/CustomerMessageFunctions');
              handleSendMessageUser(USER_ACTIVE, null, appUserId, null);
            }
          }
        }
        resolve(updateResult);
      } else {
        Logger.error(`error: failed to update user id ${appUserId}`);
        reject('failed to update user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const appUserId = req.payload.id;
      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }
      let foundUser = await AppUsersFunctions.retrieveUserDetail(req.payload.id);

      if (foundUser) {
        // lay thong tin giao dich
        await AppUsersFunctions.retrieveUserTransaction(foundUser);
        resolve(foundUser);
      } else {
        Logger.error(`error can not find user by id:${req.payload.id}`);
        reject(`can not find user`);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }
      let now = new Date().getTime();
      let user = await AppUsersResourceAccess.findById(appUserId);
      await AppUsersResourceAccess.updateById(appUserId, { phoneNumber: `${user.phoneNumber}_${now}` });
      let result = await AppUsersResourceAccess.deleteById(appUserId);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

function _getAllCachedTotalBetAmountInByUser(appUserId) {
  let _totalPlay = 0;
  for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    const _betType = Object.values(BET_TYPE)[i];
    // if (!isPlayGameRecordByType(_betType)) {
    let _playDataArray = getCachedTotalBetAmountInByUser({ appUserId: appUserId, username: '' }, _betType);
    for (let counter = 0; counter < _playDataArray.length; counter++) {
      const _playData = _playDataArray[counter];
      if (utilitiesFunction.isValidValue(_playData.recordAmountIn)) {
        _totalPlay += _playData.recordAmountIn * 1;
      }
    }
    // }
  }
  return _totalPlay;
}

function _getAllCachedTotalMissionBetAmountInByUser(appUserId) {
  let _totalPlay = 0;
  for (let i = 0; i < Object.values(BET_TYPE).length; i++) {
    const _betType = Object.values(BET_TYPE)[i];
    // if (!isPlayGameRecordByType(_betType)) {
    let _playDataArray = getCachedTotalBetMissionAmountInByUser({ appUserId: appUserId, username: '' }, _betType);
    for (let counter = 0; counter < _playDataArray.length; counter++) {
      const _playData = _playDataArray[counter];
      if (utilitiesFunction.isValidValue(_playData.recordAmountIn)) {
        _totalPlay += _playData.recordAmountIn * 1;
      }
    }
    // }
  }
  return _totalPlay;
}

async function _fetchAllDetailOfUser(foundUser) {
  //lay so luong thong bao chua doc cua user
  await AppUsersFunctions.getUnreadNotificationCount(foundUser);

  //lay so luong giao dich & so tien da rut cua user
  //lay thong tin giao dich
  // await AppUsersFunctions.retrieveUserTransaction(foundUser);

  //cap nhat lai nhiem vu
  const { getUserMissionInfo, updateUserMissionInfo } = require('../../AppUserMission/AppUserMissionFunction');

  //cap nhat lai lan rut tien dau tien
  if (utilitiesFunction.isNotEmptyStringValue(foundUser.firstWithdrawAt) === false) {
    await updateFirstWithdrawForUser(foundUser.appUserId);
  }

  await updateUserMissionInfo(foundUser.appUserId);

  //lay thong tin nhiem vu hien tai cua user
  let _userInfo = await getUserMissionInfo(foundUser.appUserId);

  if (_userInfo) {
    //sua lai hien thi, chi hien thi cac nhiem vu da lam
    _userInfo.remainingMissionCount = _userInfo.maxMissionCount - _userInfo.remainingMissionCount;
    if (_userInfo.remainingMissionCount < 0) {
      _userInfo.remainingMissionCount = 0;
    }
    foundUser.appUserMission = _userInfo;
  }

  if (foundUser.wallets && foundUser.wallets.length > 0) {
    for (let i = 0; i < foundUser.wallets.length; i++) {
      const _wallet = foundUser.wallets[i];
      if (_wallet.walletType === WALLET_TYPE.POINT) {
        foundUser.wallets[i].balance = foundUser.wallets[i].balance - _getAllCachedTotalBetAmountInByUser(foundUser.appUserId);
      } else if (_wallet.walletType === WALLET_TYPE.MISSION) {
        foundUser.wallets[i].balance = foundUser.wallets[i].balance - _getAllCachedTotalMissionBetAmountInByUser(foundUser.appUserId);
      }
    }
  }
  let _betRecordList = getAllBetRecordListByUser(foundUser);
  if (_betRecordList) {
    foundUser.betRecordList = _betRecordList;
  }

  let _betMissionRecordList = getAllBetMissionRecordByUser(foundUser);
  if (_betMissionRecordList) {
    foundUser.betMissionRecordList = _betMissionRecordList;
  }
}
async function userGetDetailById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let foundUser = await AppUsersFunctions.retrieveUserDetail(req.currentUser.appUserId);
      if (foundUser) {
        await _fetchAllDetailOfUser(foundUser);
        resolve(foundUser);
      } else {
        Logger.error(`error get detail by id ${req.currentUser.appUserId} failed`);
        reject('Get detail failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function registerUser(req) {
  return insert(req);
}

async function registerUserByPhone(req) {
  let userData = req.payload;
  //Lưu họ và tên vào hết firstName
  if (userData.fullName) {
    userData.firstName = userData.fullName;
    //loại bỏ field fullName, để ko bị lỗi DUPLICATED_USER
    delete userData.fullName;
  }

  const userAgent = req.headers['user-agent'];
  let _userDevice = getUserDeviceFromUserAgent(userAgent);
  if (
    utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceName) &&
    // utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceBrand) &&
    utilitiesFunction.isNotEmptyStringValue(_userDevice.deviceType)
  ) {
    // return 'register ok';
  }

  //Coi số điện thoại là username luôn
  userData.username = req.payload.phoneNumber;
  userData.isVerifiedPhoneNumber = USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED;
  return await _registerUser(req, userData);
}

async function registerUserByEmail(req) {
  let userData = req.payload;

  //Coi số điện thoại là username luôn
  userData.username = req.payload.email;

  return await _registerUser(req, userData);
}

async function _login(username, password, req) {
  //verify credential
  let foundUser = await AppUsersFunctions.verifyUserCredentials(username, password);

  if (foundUser) {
    await _fetchAllDetailOfUser(foundUser);

    if (foundUser.active === 0) {
      throw USER_ERROR.USER_LOCKED;
    }
    // if (foundUser.isVerifiedPhoneNumber !== USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED) {
    //   throw USER_ERROR.NOT_VERIFIED_PHONE;
    // }

    //lay so luong thong bao chua doc cua user
    await AppUsersFunctions.getUnreadNotificationCount(foundUser);

    await AppUsersResourceAccess.updateById(foundUser.appUserId, {
      lastActiveAt: new Date(),
    });
    const userAgent = req.headers['user-agent'];
    await saveUserDevice(foundUser.appUserId, userAgent, ACTION.LOGIN);
    if (foundUser.twoFAEnable && foundUser.twoFAEnable > 0) {
      return {
        appUserId: foundUser.appUserId,
        twoFAEnable: foundUser.twoFAEnable,
      };
    } else {
      return foundUser;
    }
  }
}

async function loginByPhone(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let username = req.payload.phoneNumber;
      let password = req.payload.password;

      let foundUser = await _login(username, password);
      if (foundUser) {
        _storeUserIp(req, foundUser);
        resolve(foundUser);
      } else {
        Logger.error(`error AppUserManage loginByPhone: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('loginByPhone error');
    }
  });
}
async function loginByToken(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let token = req.payload.token;
      let _userData = TokenFunction.decodeToken(token);

      //invalid token
      if (_userData === undefined) {
        Logger.error(`invalid token`);
        reject('INVALID_TOKEN');
        return;
      }

      let foundUser = await AppUsersFunctions.retrieveUserDetail(_userData.appUserId);

      if (foundUser) {
        _storeUserIp(req, foundUser);

        resolve(foundUser);
      } else {
        Logger.error(`error AppUserManage loginByToken: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('loginByToken error');
    }
  });
}
async function loginByEmail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let username = req.payload.email;
      let password = req.payload.password;

      let foundUser = await _login(username, password);
      if (foundUser && foundUser.isVerifiedEmail !== USER_VERIFY_EMAIL_STATUS.IS_VERIFIED) {
        await _sendOTPToUserEmail(foundUser);
        reject(USER_ERROR.NOT_VERIFIED_EMAIL);
      } else {
        if (foundUser) {
          _storeUserIp(req, foundUser);
          resolve(foundUser);
        } else {
          Logger.error(`error AppUserManage loginByEmail: `);
          reject('failed');
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (e === USER_ERROR.NOT_VERIFIED_EMAIL) {
        Logger.error(`error AppUserManage loginByEmail: ${USER_ERROR.NOT_VERIFIED_EMAIL}`);
        reject(USER_ERROR.NOT_VERIFIED_EMAIL);
      } else if (e === USER_ERROR.DUPLICATED_USER) {
        Logger.error(`error AppUserManage loginByEmail: ${USER_ERROR.DUPLICATED_USER}`);
        reject(USER_ERROR.DUPLICATED_USER);
      } else if (e === USER_ERROR.DUPLICATED_USER_EMAIL) {
        Logger.error(`error AppUserManage loginByEmail: ${USER_ERROR.DUPLICATED_USER_EMAIL}`);
        reject(USER_ERROR.DUPLICATED_USER_EMAIL);
      } else if (e === USER_ERROR.DUPLICATED_USER_PHONE) {
        Logger.error(`error AppUserManage loginByEmail: ${USER_ERROR.DUPLICATED_USER_PHONE}`);
        reject(USER_ERROR.DUPLICATED_USER_PHONE);
      } else {
        Logger.error(`error AppUserManage loginByEmail: `);
        reject('failed');
      }
    }
  });
}

async function loginUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let username = req.payload.username;
      let password = req.payload.password;

      let foundUser = await _login(username, password, req);
      if (foundUser) {
        //kiem tra login sai va kiem tra co bi block login khong
        if (foundUser.blockedLogin >= USER_BLOCK_ACTION.BLOCK) {
          return reject(USER_ERROR.USER_BLOCKED);
        }
        _storeUserIp(req, foundUser, foundUser.token);
        resolve(foundUser);
      } else {
        //tang số lượt login sai
        const user = await AppUsersResourceAccess.find({ username: username }, 0, 1);
        if (user && user.length > 0) {
          const currentFail = user[0].blockedLogin + 1;
          await AppUsersResourceAccess.updateById(user[0].appUserId, { blockedLogin: currentFail });
          return reject(`${USER_ERROR.LOGIN_FAIL}_${currentFail}`);
        }
        return reject(`${USER_ERROR.LOGIN_FAIL}_${0}`);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (e === USER_ERROR.INVALID_REFER_USER) {
        Logger.error(`error login user: ${USER_ERROR.INVALID_REFER_USER}`);
        reject(USER_ERROR.INVALID_REFER_USER);
      } else if (e === USER_ERROR.USER_LOCKED) {
        Logger.error(`error login user: ${USER_ERROR.USER_LOCKED}`);
        reject(USER_ERROR.USER_LOCKED);
      } else {
        Logger.error(`error login user: `);
        reject('failed');
      }
    }
  });
}

async function adminUnblockLoginUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let result = 0;
      const user = await AppUsersResourceAccess.findById(appUserId);
      if (user) {
        result = await AppUsersResourceAccess.updateById(user.appUserId, { blockedLogin: USER_BLOCK_ACTION.UNBLOCK });
      }
      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminUnblockWithDrawBank(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let result = 0;
      const user = await AppUsersResourceAccess.findById(appUserId);
      if (user) {
        result = await AppUsersResourceAccess.updateById(user.appUserId, { blockedWithdrawBank: USER_BLOCK_ACTION.UNBLOCK });
      }
      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminUnblockWithDrawCrypto(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let result = 0;
      const user = await AppUsersResourceAccess.findById(appUserId);
      if (user) {
        result = await AppUsersResourceAccess.updateById(user.appUserId, { blockedWithdrawCrypto: USER_BLOCK_ACTION.UNBLOCK });
      }
      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function changePasswordUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const currentUser = req.currentUser;
      let username = currentUser.username;
      let password = req.payload.password;
      let newPassword = req.payload.newPassword;
      //kiem tra so lan sai quan 5
      if (currentUser.blockedLogin >= USER_BLOCK_ACTION.BLOCK) {
        return reject(USER_ERROR.USER_BLOCKED);
      }
      //verify credential
      let foundUser = await AppUsersFunctions.verifyUserCredentials(username, password);

      if (foundUser) {
        let result = AppUsersFunctions.changeUserPassword(foundUser, newPassword);
        if (result) {
          return resolve(result);
        }
        return reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
      }
      //sai mat khau => tang so lan sai
      const currentFail = currentUser.blockedLogin + 1;
      await AppUsersResourceAccess.updateById(currentUser.appUserId, { blockedLogin: currentFail });
      Logger.error(`User change password fail count: ${currentFail}`);
      return reject(`${USER_ERROR.LOGIN_FAIL}_${currentFail}`);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function verify2FA(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let users = await AppUsersResourceAccess.find({
        appUserId: req.payload.id,
      });
      if (users && users.length > 0) {
        let foundUser = users[0];
        if (foundUser) {
          let otpCode = req.payload.otpCode;

          let verified = AppUsersFunctions.verify2FACode(otpCode.toString(), foundUser.twoFACode);

          if (verified) {
            foundUser = await AppUsersFunctions.retrieveUserDetail(foundUser.appUserId);

            await AppUsersResourceAccess.updateById(foundUser.appUserId, {
              twoFAEnable: true,
            });
            resolve(foundUser);
          } else {
            Logger.error(`error verify2FA`);
            reject('failed to verify2FA');
          }
        } else {
          Logger.error(`error user is invalid to verify2FA with AppUserId ${req.payload.id}`);
          reject('user is invalid to verify2FA');
        }
      } else {
        Logger.error(`error user not found to verify2FA with AppUserId ${req.payload.id}`);
        reject('user not found to verify2FA');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _loginSocial(username, password, name, email, avatar, socialInfo) {
  //verify credential
  let foundUser = await AppUsersResourceAccess.find({
    username: username,
  });

  //if user is not found
  if (foundUser === undefined || foundUser.length < 1) {
    let newUserData = {
      username: username,
      password: password,
      firstName: name,
      userAvatar: avatar,
    };

    if (socialInfo) {
      newUserData.socialInfo = JSON.stringify(socialInfo);
    }

    let newUser = await _registerUser(req, newUserData);

    if (!newUser) {
      return undefined;
    }

    foundUser = newUser;
  } else {
    foundUser = foundUser[0];
    foundUser = await AppUsersFunctions.retrieveUserDetail(foundUser.appUserId);
  }

  await AppUsersResourceAccess.updateById(foundUser.appUserId, {
    lastActiveAt: new Date(),
  });

  if (foundUser.active === 0) {
    return undefined;
  }

  if (foundUser.twoFAEnable && foundUser.twoFAEnable > 0) {
    return {
      appUserId: foundUser.appUserId,
      twoFAEnable: foundUser.twoFAEnable,
    };
  } else {
    return foundUser;
  }
}

async function loginFacebook(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.facebook_id && req.payload.facebook_id !== '' && req.payload.facebook_id !== null) {
        let username = 'FB_' + req.payload.facebook_id;
        let password = req.payload.facebook_id;
        let avatar = req.payload.facebook_avatar;
        let email = req.payload.facebook_email;
        let firstName = req.payload.facebook_name;

        let foundUser = await _loginSocial(username, password, firstName, email, avatar, req.payload);
        if (foundUser) {
          _storeUserIp(req, foundUser);
          if (foundUser.active === 0) {
            reject('user is locked');
            return;
          }

          //lay so luong thong bao chua doc cua user
          await AppUsersFunctions.getUnreadNotificationCount(foundUser);

          resolve(foundUser);
        } else {
          Logger.error(`error loginFacebook: `);
          reject('failed');
        }
      } else {
        Logger.error(`error loginFacebook: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function loginGoogle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.google_id && req.payload.google_id !== '' && req.payload.google_id !== null) {
        let username = 'GOOGLE_' + req.payload.google_id;
        let password = req.payload.google_id;
        let avatar = req.payload.google_avatar;
        let email = req.payload.google_email;
        let firstName = req.payload.google_name;

        let loginResult = await _loginSocial(username, password, firstName, email, avatar, req.payload);
        if (loginResult) {
          _storeUserIp(req, foundUser);
          if (foundUser.active === 0) {
            reject('user is locked');
            return;
          }
          resolve(loginResult);
        } else {
          Logger.error(`error loginGoogle: `);
          reject('failed');
        }
      } else {
        Logger.error(`error loginGoogle: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function loginApple(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.apple_id && req.payload.apple_id !== '' && req.payload.apple_id !== null) {
        let username = 'APPLE_' + req.payload.apple_id;
        let password = req.payload.apple_id;
        let avatar = req.payload.apple_avatar;
        let email = req.payload.apple_email;
        let firstName = req.payload.apple_name;

        let foundUser = await _loginSocial(username, password, firstName, email, avatar, req.payload);
        if (foundUser) {
          _storeUserIp(req, foundUser);
          if (foundUser.active === 0) {
            reject('user is locked');
          }
          //lay so luong thong bao chua doc cua user
          await AppUsersFunctions.getUnreadNotificationCount(foundUser);

          resolve(foundUser);
        } else {
          Logger.error(`error loginApple: `);
          reject('failed');
        }
      } else {
        Logger.error(`error loginApple: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function loginZalo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.zalo_id && req.payload.zalo_id !== '' && req.payload.zalo_id !== null) {
        let username = 'ZALO_' + req.payload.zalo_id;
        let password = req.payload.zalo_id;
        let avatar = req.payload.zalo_avatar;
        let email = req.payload.zalo_email;
        let firstName = req.payload.zalo_name;

        let foundUser = await _loginSocial(username, password, firstName, email, avatar, req.payload);
        if (foundUser) {
          _storeUserIp(req, foundUser);
          if (foundUser.active === 0) {
            reject('user is locked');
          }

          //lay so luong thong bao chua doc cua user
          await AppUsersFunctions.getUnreadNotificationCount(foundUser);

          resolve(foundUser);
        } else {
          Logger.error(`error loginZalo: `);
          reject('failed');
        }
      } else {
        Logger.error(`error loginZalo: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userUpdateInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = req.payload.data;
      let id = req.payload.id;

      if (userData.firstName) {
        let existedFirstname = await AppUsersResourceAccess.find({ firstName: userData.firstName });
        if (existedFirstname && existedFirstname.length > 0) {
          if (existedFirstname[0].appUserId !== id) {
            return reject(USER_ERROR.DUPLICATED_USER_FIRSTNAME);
          }
        }
      }

      const existedPhoneUser = await _existedUserPhoneNumber(userData);
      if (existedPhoneUser) {
        if (existedPhoneUser.appUserId !== id) {
          reject(USER_ERROR.DUPLICATED_USER_PHONE);
          return; //always add "return" after reject / resolve to make sure everything will break
        }
      }

      const existedEmailUser = await _existedUserEmail(userData);
      if (existedEmailUser) {
        if (existedEmailUser.appUserId !== id) {
          reject(USER_ERROR.DUPLICATED_USER_EMAIL);
          return; //always add "return" after reject / resolve to make sure everything will break
        }
      }

      if (userData.phoneNumber !== null && userData.phoneNumber !== undefined) {
        userData.isVerifiedPhoneNumber = USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED;
      }
      let user = await AppUsersResourceAccess.findById(id);
      let dataBefore = {};
      for (let i = 0; i < Object.keys(userData).length; i++) {
        const element = Object.keys(userData)[i];
        dataBefore[element] = user[element];
      }
      let updateResult = await AppUsersResourceAccess.updateById(id, userData);
      if (updateResult) {
        await logUserUpdateAppUserData(dataBefore, userData, id, req.currentUser);
        const foundUser = await AppUsersFunctions.retrieveUserDetail(req.payload.id);
        if (foundUser) {
          //kiem tra hop dieu kien thi cong them 1 nhiem vu
          const { addFirstMissionForUser } = require('../../AppUserMission/AppUserMissionFunction');
          let _addResult = await addFirstMissionForUser(id);
          if (_addResult) {
            const WalletFunction = require('../../Wallet/WalletFunctions');
            const { createMissionBonusRecordForUser } = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
            await Promise.all([
              createMissionBonusRecordForUser(req.currentUser.appUserId),
              createMissionBonusRecordForUser(req.currentUser.memberReferIdF1),
              WalletFunction.resetMissionWalletBalance(req.currentUser.appUserId),
            ]);
          }
          resolve(foundUser);
        } else {
          Logger.error(`userUpdateInfo can not retriveUserDetail`);
          reject('can not find user to update');
        }
      } else {
        Logger.error('userUpdateInfo failed to update user');
        reject('failed to update user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function getUsersByMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let start = new Date(startDate);
      let end = new Date(endDate);
      var diff = (end - start) / 1000 / 60 / 60 / 24;
      if (diff > 365) {
        reject('start date and end date is so far');
      }
      let filter = {};

      var users = await AppUserView.countUserMonthByYear(filter, startDate, endDate);
      end = new Date(moment(endDate).endOf('month').format('YYYY-MM-DD'));
      while (start <= end) {
        let year = start.getFullYear();
        let month = start.getMonth() + 1;
        let count = 0;
        users.forEach(item => {
          if (item.createMonth == month && item.createYear == year) {
            count++;
          }
        });
        if (count == 0) {
          users.push({
            createMonth: month,
            createYear: year,
            countCreateMonth: 0,
          });
        }
        start.setMonth(month);
      }
      for (let i = 0; i < users.length - 1; i++) {
        for (let j = i + 1; j < users.length; j++) {
          if (users[i].createYear > users[j].createYear) {
            let temp = users[i];
            users[i] = users[j];
            users[j] = temp;
          } else if (users[i].createMonth > users[j].createMonth && users[i].createYear == users[j].createYear) {
            let temp = users[i];
            users[i] = users[j];
            users[j] = temp;
          }
        }
      }
      resolve(users);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function uploadBeforeIdentityCard(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const imageData = req.payload.imageData;
      const imageFormat = req.payload.imageFormat;
      if (!imageData) {
        reject('Do not have image data');
        return;
      }
      var originaldata = Buffer.from(imageData, 'base64');
      let image = await UploadFunction.uploadMediaFile(originaldata, imageFormat, 'AppUser/IdentityCard/' + id.toString() + '/');
      if (image) {
        let updateResult = await AppUsersResourceAccess.updateById(id, {
          imageBeforeIdentityCard: image,
        });
        if (updateResult) {
          resolve(image);
        } else {
          Logger.error(`error upload Before Identity Card`);
          reject('failed to upload');
        }
      } else {
        Logger.error(`error upload Before Identity Card`);
        reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function uploadAfterIdentityCard(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const imageData = req.payload.imageData;
      const imageFormat = req.payload.imageFormat;
      if (!imageData) {
        reject('Do not have image data');
        return;
      }
      var originaldata = Buffer.from(imageData, 'base64');
      let image = await UploadFunction.uploadMediaFile(originaldata, imageFormat, 'AppUser/IdentityCard/' + id.toString() + '/');
      if (image) {
        let updateResult = await AppUsersResourceAccess.updateById(id, {
          imageAfterIdentityCard: image,
        });
        if (updateResult) {
          resolve(image);
        } else {
          Logger.error(`error upload After Identity Card`);
          reject('failed to upload');
        }
      } else {
        Logger.error(`error upload After Identity Card`);
        reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userSubmitIdentity(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.currentUser.appUserId;
      let updateResult = await AppUsersResourceAccess.updateById(appUserId, {
        isVerified: USER_VERIFY_INFO_STATUS.VERIFYING,
      });
      if (updateResult) {
        resolve(updateResult);
      } else {
        Logger.error(`error AppUserManager userSubmitIdentity with appUserId ${appUserId}: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function verifyInfoUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      const staff = req.currentUser;

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }

      const foundUser = await AppUsersResourceAccess.findById(appUserId);
      if (!foundUser) {
        reject('error');
        return; //to make sure everything stop
      }

      // if (staff.staffRoleId && staff.staffRoleId !== 1) {
      //   const verifyArea = verifyAreaPermission(staff, foundUser);
      //   if (!verifyArea) {
      //     reject("Don't have permission");
      //     return; //to make sure everything stop
      //   }
      // }

      let updateResult = await AppUsersResourceAccess.updateById(appUserId, {
        isVerified: USER_VERIFY_INFO_STATUS.IS_VERIFIED,
        verifiedAt: new Date(),
      });
      if (updateResult) {
        //thuong khi user KYC thanh cong
        const AppuserRewardFunctions = require('../AppUsersReferralRewardFunctions');
        await AppuserRewardFunctions.rewardForVerifiedInfo(appUserId, foundUser.referUserId);
        await AppuserRewardFunctions.rewardByTotalReferalUser(foundUser.referUserId);

        if (process.env.GOOGLE_FIREBASE_PUSH_ENABLE) {
          const messageData = {
            time: moment(new Date()).format('hh:mm DD/MM/YYYY'),
          };
          handleSendMessageUser(APPROVE_USER_INFO, messageData, appUserId, {
            validated: true,
          });
        }
        resolve(updateResult);
      } else {
        Logger.error(`error to verify info user`);
        resolve('failed to verify info user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function rejectInfoUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      const staff = req.currentUser;

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }

      if (staff.staffRoleId && staff.staffRoleId !== 1) {
        const foundUser = await AppUsersResourceAccess.findById(appUserId);
        if (!foundUser) reject('error');
        const verifyArea = verifyAreaPermission(staff, foundUser);
        if (!verifyArea) reject("Don't have permission");
      }

      let updatedData = {
        isVerified: USER_VERIFY_INFO_STATUS.REJECTED,
        verifiedAt: new Date(),
      };

      let appUserNote = req.payload.appUserNote;
      if (appUserNote) {
        updatedData.appUserNote = appUserNote;
      }
      let updateResult = await AppUsersResourceAccess.updateById(appUserId, updatedData);
      if (updateResult) {
        if (process.env.GOOGLE_FIREBASE_PUSH_ENABLE) {
          const messageData = {
            time: moment(new Date()).format('hh:mm DD/MM/YYYY'),
          };
          handleSendMessageUser(REFUSED_USER_INFO, messageData, appUserId, {
            validated: true,
          });
        }
        resolve(updateResult);
      } else {
        Logger.error(`error to reject info user`);
        resolve('failed to reject info user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function uploadAvatar(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const imageData = req.payload.imageData;
      const imageFormat = req.payload.imageFormat;
      if (!imageData) {
        reject('Do not have image data');
        return;
      }
      var originaldata = Buffer.from(imageData, 'base64');
      let image = await UploadFunction.uploadMediaFile(originaldata, imageFormat, 'AppUser/Avatar/' + id.toString() + '/');
      if (image) {
        var result = await AppUsersResourceAccess.updateById(id, {
          userAvatar: image,
        });
        if (result) {
          resolve(image);
        } else {
          Logger.error(`error upload Avatar`);
          reject('failed to upload');
        }
      } else {
        Logger.error(`error upload Avatar`);
        reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function exportExcel(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let order = req.payload.order;
      const staff = req.currentUser;
      if (staff.staffRoleId && staff.staffRoleId !== 1) {
        filter.areaProvinceId = staff.areaProvinceId;
        filter.areaDistrictId = staff.areaDistrictId;
        filter.areaWardId = staff.areaWardId;
      }
      let users = await AppUsersResourceAccess.customSearch(filter, undefined, undefined, undefined, undefined, undefined, order);
      if (users && users.length > 0) {
        const fileName = 'users' + (new Date() - 1).toString();
        let filePath = await ExcelFunction.renderExcelFile(fileName, users, 'Users');
        let url = `https://${process.env.HOST_NAME}/${filePath}`;
        resolve(url);
      } else {
        Logger.error(`error not have data`);
        resolve('Not have data');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

//TODO Implement later
async function forgotPassword(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let email = req.payload.email;
      let result = await AppUsersResourceAccess.find({ email: email });
      if (result && result.length > 0) {
        let userToken = await TokenFunction.createToken(result[0]);
        await AppUsersFunctions.sendEmailToResetPassword(result[0], userToken, email);
        resolve('success');
      } else {
        //cho dù email không tồn tại thì cũng không cần cho user biết
        //nó giúp bảo mật hơn, không dò được trong hệ thống mình có email này hay chưa
        //chỉ cần ghi log để trace là được
        Logger.error(`email ${email} do not existed in system`);
        resolve('success');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function forgotPasswordOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let phoneNumber = req.payload.phoneNumber;
      let newPassword = req.payload.password;
      let user = await AppUsersResourceAccess.find({ username: phoneNumber });
      if (user && user.length > 0) {
        user = user[0];
        let result = await AppUsersFunctions.changeUserPassword(user, newPassword);
        if (result) {
          resolve('reset password success');
        } else {
          Logger.error(`error AppUserManager forgotPasswordOTP with phoneNumber ${phoneNumber}: `);
          reject('failed');
        }
      } else {
        //cho dù email không tồn tại thì cũng không cần cho user biết
        //nó giúp bảo mật hơn, không dò được trong hệ thống mình có email này hay chưa
        //chỉ cần ghi log để trace là được
        Logger.error(`username ${phoneNumber} do not existed in system`);
        resolve('success');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function isExceedLimitedResetPassword(appUserId) {
  let _existingSetting = await AppUsersSettingResourceAccess.findById(appUserId, `resetPasswordCounter`, 1);
  if (!_existingSetting) {
    await AppUsersSettingResourceAccess.insert({
      appUserId: appUserId,
      resetPasswordCounter: 1,
    });
    _existingSetting = await AppUsersSettingResourceAccess.findById(appUserId, `resetPasswordCounter`, 1);
  }
  if (_existingSetting && _existingSetting.resetPasswordCounter >= MAX_RESET_PASSWORD_LIMITED) {
    return true;
  }
  await AppUsersSettingResourceAccess.incrementValue(appUserId, `resetPasswordCounter`, 1);
  return false;
}

async function forgotPasswordSMSOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let username = req.payload.username;
      let phoneNumber = req.payload.phoneNumber;
      let newPassword = req.payload.newPassword;
      let otp = req.payload.otpCode;
      let user = await AppUsersResourceAccess.find({ username: username, phoneNumber: phoneNumber });
      if (user && user.length > 0) {
        user = user[0];
        // let _exceedLimitResetPassword = await isExceedLimitedResetPassword(user.appUserId);
        // if (_exceedLimitResetPassword) {
        //   return reject(USER_ERROR.MAX_LIMITED_RESET_PASSWORD);
        // }
        let confirmResult = await confirmOTPById(phoneNumber, otp);
        if (!confirmResult) {
          return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
        }
        let result = await AppUsersFunctions.changeUserPassword(user, newPassword);
        if (!result) {
          Logger.error(`error AppUserManager forgotPasswordOTP with phoneNumber ${phoneNumber}: `);
          return reject(USER_ERROR.FORGOT_PASSWORD_FAIL);
        }
        return resolve(result);
      } else {
        //cho dù email không tồn tại thì cũng không cần cho user biết
        //nó giúp bảo mật hơn, không dò được trong hệ thống mình có email này hay chưa
        //chỉ cần ghi log để trace là được
        Logger.error(`username: ${username} | phonenumber: ${phoneNumber} do not existed in system`);
        return reject(USER_ERROR.USER_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      return reject(e);
    }
  });
}

async function forgotSecondaryPasswordSMSOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let phoneNumber = req.payload.phoneNumber;
      let newPassword = req.payload.newPassword;
      let otp = req.payload.otpCode;
      let user = await AppUsersResourceAccess.find({ username: phoneNumber });
      if (!user || user.length === 0) {
        user = await AppUsersResourceAccess.find({ phoneNumber: phoneNumber });
      }

      if (user && user.length > 0) {
        // let _exceedLimitResetPassword = await isExceedLimitedResetPassword(user[0].appUserId);
        // if (_exceedLimitResetPassword) {
        //   return reject(USER_ERROR.MAX_LIMITED_RESET_SECONDARY_PASSWORD);
        // }

        user = user[0];
        if (user.blockedWithdrawBank + user.blockedWithdrawCrypto >= USER_BLOCK_ACTION.BLOCK) {
          return reject(USER_ERROR.USER_BLOCKED_WITHDRAW_BANK);
        }
        let confirmResult = await confirmOTPById(phoneNumber, otp);
        if (!confirmResult) {
          return reject('otp confirm failed');
        }
        let result = await changeUserSecondaryPassword(user, newPassword);
        if (result) {
          resolve('reset password success');
        } else {
          Logger.error(`error AppUserManager forgotSecondaryPasswordSMSOTP with phoneNumber ${phoneNumber}: `);
          reject('failed');
        }
      } else {
        //cho dù email không tồn tại thì cũng không cần cho user biết
        //nó giúp bảo mật hơn, không dò được trong hệ thống mình có email này hay chưa
        //chỉ cần ghi log để trace là được
        Logger.error(`username ${phoneNumber} do not existed in system`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function forgotSecondaryPasswordEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let email = req.payload.email;
      let newPassword = req.payload.newPassword;
      let otp = req.payload.otpCode;
      let user = await AppUsersResourceAccess.find({ username: email });
      if (!user || user.length === 0) {
        user = await AppUsersResourceAccess.find({ email: email });
      }

      if (user && user.length > 0) {
        // let _exceedLimitResetPassword = await isExceedLimitedResetPassword(user[0].appUserId);
        // if (_exceedLimitResetPassword) {
        //   return reject(USER_ERROR.MAX_LIMITED_RESET_SECONDARY_PASSWORD);
        // }

        user = user[0];
        if (user.blockedWithdrawBank + user.blockedWithdrawCrypto >= USER_BLOCK_ACTION.BLOCK) {
          return reject(USER_ERROR.USER_BLOCKED_WITHDRAW_BANK);
        }
        let confirmResult = await confirmOTPById(email, otp);
        if (!confirmResult) {
          return reject('otp confirm failed');
        }
        let result = await changeUserSecondaryPassword(user, newPassword);
        if (result) {
          resolve('reset password success');
        } else {
          Logger.error(`error AppUserManager forgotSecondaryPasswordEmailOTP with email ${email}: `);
          reject('failed');
        }
      } else {
        //cho dù email không tồn tại thì cũng không cần cho user biết
        //nó giúp bảo mật hơn, không dò được trong hệ thống mình có email này hay chưa
        //chỉ cần ghi log để trace là được
        Logger.error(`username ${email} do not existed in system`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

// forgotPasswordEmailOTP
async function forgotPasswordEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let email = req.payload.email;
      let newPassword = req.payload.newPassword;
      let otp = req.payload.otpCode;
      let user = await AppUsersResourceAccess.find({ email: email });
      if (user && user.length > 0) {
        user = user[0];
        let confirmResult = await confirmOTPById(email, otp);
        if (!confirmResult) {
          return reject('otp confirm failed');
        }
        let result = await AppUsersFunctions.changeUserPassword(user, newPassword);
        if (result) {
          resolve('reset password success');
        } else {
          Logger.error(`error AppUserManager forgotPasswordOTP with email ${email}: `);
          return reject('failed');
        }
      } else {
        //cho dù email không tồn tại thì cũng không cần cho user biết
        //nó giúp bảo mật hơn, không dò được trong hệ thống mình có email này hay chưa
        //chỉ cần ghi log để trace là được
        Logger.error(`username ${email} do not existed in system`);
        return reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function resetPasswordBaseOnUserToken(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let newPassword = req.payload.password;
      let user = req.currentUser;
      if (user === undefined || user.appUserId === null) {
        reject('invalid token');
      } else {
        let result = await AppUsersFunctions.changeUserPassword(user, newPassword);
        if (result) {
          resolve('reset password success');
        } else {
          Logger.error(`error AppUserManager resetPasswordBaseOnUserToken with appUserId ${user.appUserId}: `);
          reject('failed');
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminResetPassword(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userId = req.payload.id;
      const isAllowed = await verifyStaffUser(userId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }
      let user = await AppUsersResourceAccess.findById(userId);
      const staff = req.currentUser;
      if (staff.staffRoleId && staff.staffRoleId !== 1) {
        if (!user) reject('error');
        const verifyArea = verifyAreaPermission(staff, user);
        if (!verifyArea) reject("Don't have permission");
      }
      if (user) {
        let userToken = await TokenFunction.createToken(user);
        await AppUsersFunctions.sendEmailToResetPassword(user, userToken, user.email);
        resolve('success');
      } else {
        Logger.error(`user: ${userId} is not existed in system`);
        resolve('success');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function verifyEmailUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = req.currentUser;
      if (user === undefined || user.appUserId === null) {
        reject('invalid token');
      } else {
        let result = await AppUsersResourceAccess.updateById(user.appUserId, {
          isVerifiedEmail: USER_VERIFY_EMAIL_STATUS.IS_VERIFIED,
        });
        if (result) {
          const messageData = {
            time: moment(new Date()).format('hh:mm DD/MM/YYYY'),
          };

          if (process.env.GOOGLE_FIREBASE_PUSH_ENABLE) {
            const { APPROVE_USER_INFO, REFUSED_USER_INFO, USER_LOCKED, USER_ACTIVE } = require('../../CustomerMessage/CustomerMessageConstant');
            const { handleSendMessageUser } = require('../../CustomerMessage/CustomerMessageFunctions');
            handleSendMessageUser(APPROVE_USER_INFO, messageData, user.appUserId, { validated: true });
          }

          resolve('Verify email success');
        } else {
          Logger.error(`error AppUserManager verifyEmailUser with appUserId ${user.appUserId}: `);
          reject('failed');
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function sendMailToVerifyEmail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let email = req.payload.email;
      let userId = req.currentUser.appUserId;
      let result = await AppUsersResourceAccess.find({
        appUserId: userId,
        email: email,
      });
      if (result && result.length > 0) {
        let userToken = await TokenFunction.createToken(result[0]);
        await AppUsersFunctions.sendEmailToVerifyEmail(result[0], userToken, email);
        resolve('success');
      } else {
        Logger.error(`email ${email} do not existed in system`);
        resolve('success');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminChangePasswordUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      let newPassword = req.payload.password;

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }

      let foundUser = await AppUsersResourceAccess.find(
        {
          appUserId: appUserId,
        },
        0,
        1,
      );

      if (foundUser && foundUser.length > 0) {
        let result = await AppUsersFunctions.changeUserPassword(foundUser[0], newPassword);
        if (result) {
          await logAdminUpdateAppUserData({ password: null }, { password: newPassword }, req.currentUser, appUserId);
          resolve(result);
        }
      } else {
        reject('change user password failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminLockUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }

      let result = await AppUsersResourceAccess.updateById(appUserId, {
        active: 0,
      });
      if (result) {
        resolve(result);
      } else {
        reject('lock user failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminChangeSecondaryPasswordUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      let newPassword = req.payload.password;

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      }

      let foundUser = await AppUsersResourceAccess.find(
        {
          appUserId: appUserId,
        },
        0,
        1,
      );

      if (foundUser && foundUser.length > 0) {
        let result = await changeUserSecondaryPassword(foundUser[0], newPassword);
        if (result) {
          await logAdminUpdateAppUserData({ secondaryPassword: null }, { secondaryPassword: newPassword }, req.currentUser, appUserId);
          resolve(result);
        }
      }
      Logger.error(`error admin Change Secondary Password User: ${appUserId}`);
      reject('change user password failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userChangeSecondaryPassword(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.currentUser.appUserId;
      let newPassword = req.payload.password;
      let oldPassword = req.payload.oldPassword;
      let foundUser = await AppUsersResourceAccess.find(
        {
          appUserId: appUserId,
        },
        0,
        1,
      );

      if (foundUser && foundUser.length > 0) {
        const user = foundUser[0];
        if (user.blockedWithdrawBank + user.blockedWithdrawCrypto >= USER_BLOCK_ACTION.BLOCK) {
          return reject(USER_ERROR.USER_BLOCKED_WITHDRAW_BANK);
        }
        let result = await changeUserSecondaryPassword(user, newPassword, oldPassword);
        if (result) {
          if (result == -1) {
            //nhap sai mat khau cu => tang so lan sai
            const currentFail = req.currentUser.blockedWithdrawBank + 1;
            const totalFailCount = currentFail + req.currentUser.blockedWithdrawCrypto;
            await AppUsersResourceAccess.updateById(user.appUserId, { blockedWithdrawBank: currentFail });
            return reject(`${USER_ERROR.NOT_AUTHORIZED}_${totalFailCount}`);
          }

          //kiem tra hop dieu kien thi cong them 1 nhiem vu
          const { addFirstMissionForUser } = require('../../AppUserMission/AppUserMissionFunction');
          let _addResult = await addFirstMissionForUser(req.currentUser.appUserId);
          if (_addResult) {
            const WalletFunction = require('../../Wallet/WalletFunctions');
            const { createMissionBonusRecordForUser } = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
            await Promise.all([
              createMissionBonusRecordForUser(req.currentUser.appUserId),
              createMissionBonusRecordForUser(req.currentUser.memberReferIdF1),
              WalletFunction.resetMissionWalletBalance(req.currentUser.appUserId),
            ]);
          }

          return resolve(result);
        }
        return reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
      }
      Logger.error(`error user Change Secondary Password User: ${appUserId}`);
      return reject(USER_ERROR.NOT_AUTHORIZED);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userViewsListMembership(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      filter = { ...req.payload.filter };
      filter.appUserId = req.currentUser.appUserId;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0) {
          //loc theo dai ly neu khong admin
          filter.staffId = req.currentUser.staffId;
        }
      }

      // if (req.currentUser.staffRoleId === ROLE_NAME.CSKH) {
      //   if (utilitiesFunction.isNotEmptyStringValue(searchText)) {
      //     return resolve(_searchContactByCSKH(req.payload));
      //   } else {
      //     return resolve({ data: [], total: 0 });
      //   }
      // }
      let promiseList = [];

      let _userList = AppUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      promiseList.push(_userList);
      skip = skip + limit;
      let resultCount = AppUserView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      promiseList.push(resultCount);

      Promise.all(promiseList).then(async values => {
        let _userList = values[0];
        if (_userList && _userList.length > 0) {
          for (let i = 0; i < _userList.length; i++) {
            _userList[i] = await AppUsersFunctions.retrieveUserDetail(_userList[i].appUserId);
            delete _userList[i].token;
          }
          resolve({ data: _userList, total: values[1].length });
        } else {
          resolve({ data: [], total: 0 });
        }
      });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function resetWithdrawCountDay(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.id;
      let userSetting = await AppUsersSettingResourceAccess.findById(appUserId);
      if (userSetting) {
        let result = await AppUsersSettingResourceAccess.updateById(appUserId, { withdrawCount: 0 });
        if (result) {
          resolve(result);
        } else {
          reject(USER_ERROR.USER_UPDATE_FAILED);
        }
      } else {
        let result = await AppUsersSettingResourceAccess.insert({ appUserId: appUserId, withdrawCount: 0 });
        if (result) {
          resolve(result);
        } else {
          reject(USER_ERROR.USER_UPDATE_FAILED);
        }
      }
    } catch (error) {
      Logger.error('Find all users have branch failed', error);
      reject('failed');
    }
  });
}
async function findAllUsersFollowingReferId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let dataUser = await AppUserView.findAllUsersFollowingReferId(filter, skip, limit, startDate, endDate, searchText, order);
      if (dataUser && dataUser.length > 0) {
        let count = await AppUserView.countAllUsersByReferId(filter, startDate, endDate, searchText, order);

        resolve({
          data: dataUser,
          count: count[0].count,
        });
      } else {
        resolve({
          data: [],
          count: 0,
        });
      }
    } catch (error) {
      Logger.error('Find all users have branch failed', error);
      reject('failed');
    }
  });
}

async function userFindReferedUserByUserId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        reject(ERROR.NOT_ENOUGH_AUTHORITY);
        return;
      }
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let searchText = req.payload.searchText;
      let appUserMembershipId = req.payload.appUserMembershipId;

      const memberReferObject = {
        appUserId: currentUser.appUserId,
      };

      const dataUser = await AppUsersResourceAccess.findReferedUserByUserId(
        memberReferObject,
        skip,
        limit,
        undefined,
        undefined,
        searchText,
        appUserMembershipId,
      );
      if (dataUser && dataUser.length > 0) {
        let count = await AppUsersResourceAccess.countReferedUserByUserId(memberReferObject, undefined, undefined, searchText, appUserMembershipId);
        let dataInsert = [];
        let result = [];
        for (let i = 0; i < dataUser.length; i++) {
          let userGamePlaysReports = await UserGamePlaysReportView.findById(dataUser[i].appUserId);
          if (!userGamePlaysReports) {
            let countRefered = await AppUsersFunctions.countReferedUser(dataUser[i], currentUser);
            let data = {
              appUserId: countRefered.appUserId,
              totalF1UserCount: countRefered.totalF1UserCount,
              totalSystemUserCount: countRefered.totalSystemUserCount,
              totalBetRecordAmountIn: countRefered.totalBetRecordAmountIn,
              sumSystemBetAmountIn: countRefered.totalBetRecordAmountIn,
            };
            dataInsert.push(data);
            result.push(data);
          } else {
            let now = moment();
            let diff = now.diff(moment(userGamePlaysReports.updatedAt), 'minutes');
            if (diff > 5) {
              let countRefered = await AppUsersFunctions.countReferedUser(dataUser[i], currentUser);
              let data = {
                appUserId: countRefered.appUserId,
                totalF1UserCount: countRefered.totalF1UserCount,
                totalSystemUserCount: countRefered.totalSystemUserCount,
                totalBetRecordAmountIn: countRefered.totalBetRecordAmountIn,
                sumSystemBetAmountIn: countRefered.sumSystemBetAmountIn,
              };
              await UserGamePlaysReportResourceAccess.updateById(countRefered.appUserId, data);
              result.push(data);
            } else {
              result.push(userGamePlaysReports);
            }
          }
        }
        if (dataInsert && dataInsert.length > 0) {
          await UserGamePlaysReportResourceAccess.insert(dataInsert);
        }
        resolve({
          data: result,
          count: count[0].count,
          totalSystemBonus: 0,
          totalSystemBetRecordAmountIn: 0,
        });
      } else {
        resolve({
          data: [],
          count: 0,
        });
      }
    } catch (error) {
      Logger.error('Find users have branch failed', error);
      reject('failed');
    }
  });
}

async function findReferedUserByUserId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        reject(ERROR.NOT_ENOUGH_AUTHORITY);
        return;
      }
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = req.payload.filter || {};
      let searchText = req.payload.searchText;
      const memberReferObject = {
        appUserId: filter.appUserId,
      };
      let _userFilter = {};
      if (filter.staffId) {
        _userFilter.staffId = filter.staffId;
      }
      const dataUser = await AppUsersResourceAccess.findReferedUserByUserId(
        memberReferObject,
        skip,
        limit,
        undefined,
        undefined,
        searchText,
        filter.appUserMembershipId,
        _userFilter,
      );
      if (dataUser && dataUser.length > 0) {
        let count = await AppUsersResourceAccess.countReferedUserByUserId(
          memberReferObject,
          undefined,
          undefined,
          searchText,
          filter.appUserMembershipId,
          _userFilter,
        );

        let _bonusFilter = {};
        if (filter.appUserId) {
          _bonusFilter.appUserId = filter.appUserId;
        }

        if (filter.staffId) {
          _bonusFilter.staffId = filter.staffId;
        }
        for (let i = 0; i < dataUser.length; i++) {
          _bonusFilter.referUserId = dataUser[i].appUserId;
          const [totalDeposit, totalWithdraw, totalBetRecordAmountIn, totalBetRecordAmountWin, totalBonus] = await Promise.all([
            SummaryUserPaymentDepositTransactionView.find({
              appUserId: dataUser[i].appUserId,
            }),
            SummaryUserWithdrawTransactionView.find({
              appUserId: dataUser[i].appUserId,
            }),
            GamePlayRecordsView.sum('betRecordAmountIn', {
              appUserId: dataUser[i].appUserId,
            }),
            GamePlayRecordsView.sum('betRecordWin', {
              appUserId: dataUser[i].appUserId,
            }),
            PaymentBonusTransactionReferUserView.customSum('paymentAmount', _bonusFilter),
          ]);
          delete dataUser[i].password;
          delete dataUser[i].secondaryPassword;
          delete dataUser[i].twoFACode;
          dataUser[i].totalDeposit = totalDeposit && totalDeposit.length > 0 ? totalDeposit[0].totalSum : 0;
          dataUser[i].totalWithdraw = totalWithdraw && totalWithdraw.length > 0 ? totalWithdraw[0].totalSum : 0;
          dataUser[i].totalBetRecordAmountIn = totalBetRecordAmountIn && totalBetRecordAmountIn.length > 0 ? totalBetRecordAmountIn[0].sumResult : 0;
          dataUser[i].totalBetRecordAmountWin =
            totalBetRecordAmountWin && totalBetRecordAmountWin.length > 0 ? totalBetRecordAmountWin[0].sumResult : 0;
          dataUser[i].totalBonus = totalBonus && totalBonus.length > 0 ? totalBonus[0].sumResult : 0;
          dataUser[i].totalProfit = dataUser[i].totalBetRecordAmountWin;
        }
        resolve({
          data: dataUser,
          count: count[0].count,
          totalSystemBonus: 0,
          totalSystemBetRecordAmountIn: 0,
        });
      } else {
        resolve({
          data: [],
          count: 0,
        });
      }
    } catch (error) {
      Logger.error('Find users have branch failed', error);
      reject('failed');
    }
  });
}

async function summaryReferedUserByUserId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        reject(ERROR.NOT_ENOUGH_AUTHORITY);
        return;
      }
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = req.payload.filter || {};
      let searchText = req.payload.searchText;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      const memberReferObject = {
        appUserId: filter.appUserId,
      };
      let _userFilter = {};
      if (filter.staffId) {
        _userFilter.staffId = filter.staffId;
      }
      const dataUser = await AppUsersResourceAccess.findReferedUserByUserId(
        memberReferObject,
        skip,
        limit,
        undefined,
        undefined,
        searchText,
        filter.appUserMembershipId,
        _userFilter,
      );
      if (dataUser && dataUser.length > 0) {
        let count = await AppUsersResourceAccess.countReferedUserByUserId(
          memberReferObject,
          undefined,
          undefined,
          searchText,
          filter.appUserMembershipId,
          _userFilter,
        );

        let _bonusFilter = {};
        if (filter.appUserId) {
          _bonusFilter.appUserId = filter.appUserId;
        }

        if (filter.staffId) {
          _bonusFilter.staffId = filter.staffId;
        }

        const PaymentWithdrawTransactionResourceAccess = require('../../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');
        const PaymentDepositTransactionResourceAccess = require('../../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
        for (let i = 0; i < dataUser.length; i++) {
          _bonusFilter.referUserId = dataUser[i].appUserId;
          const [totalDeposit, totalWithdraw, totalBetRecordAmountIn, totalBetRecordAmountWin, totalBonus] = await Promise.all([
            PaymentDepositTransactionResourceAccess.customSum(
              'paymentAmount',
              {
                appUserId: dataUser[i].appUserId,
                paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
              },
              startDate,
              endDate,
            ),
            PaymentWithdrawTransactionResourceAccess.customSum(
              'paymentAmount',
              {
                appUserId: dataUser[i].appUserId,
                paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
              },
              undefined,
              undefined,
              startDate,
              endDate,
            ),
            GamePlayRecordsView.customSum(
              'betRecordAmountIn',
              {
                appUserId: dataUser[i].appUserId,
              },
              undefined,
              startDate,
              endDate,
            ),
            GamePlayRecordsView.customSum(
              'betRecordWin',
              {
                appUserId: dataUser[i].appUserId,
              },
              undefined,
              startDate,
              endDate,
            ),
            PaymentBonusTransactionReferUserView.customSum('paymentAmount', _bonusFilter, startDate, endDate),
          ]);
          delete dataUser[i].password;
          delete dataUser[i].secondaryPassword;
          delete dataUser[i].twoFACode;
          dataUser[i].totalDeposit = totalDeposit && totalDeposit.length > 0 ? totalDeposit[0].totalSum : 0;
          dataUser[i].totalWithdraw = totalWithdraw && totalWithdraw.length > 0 ? totalWithdraw[0].totalSum : 0;
          dataUser[i].totalBetRecordAmountIn = totalBetRecordAmountIn && totalBetRecordAmountIn.length > 0 ? totalBetRecordAmountIn[0].sumResult : 0;
          dataUser[i].totalBetRecordAmountWin =
            totalBetRecordAmountWin && totalBetRecordAmountWin.length > 0 ? totalBetRecordAmountWin[0].sumResult : 0;
          dataUser[i].totalBonus = totalBonus && totalBonus.length > 0 ? totalBonus[0].sumResult : 0;
          dataUser[i].totalProfit = dataUser[i].totalBetRecordAmountWin;
        }
        resolve({
          data: dataUser,
          count: count[0].count,
          totalSystemBonus: 0,
          totalSystemBetRecordAmountIn: 0,
        });
      } else {
        resolve({
          data: [],
          count: 0,
        });
      }
    } catch (error) {
      Logger.error('Find users have branch failed', error);
      reject('failed');
    }
  });
}

async function userCheckExistingAccount(req) {
  return new Promise(async (resolve, reject) => {
    try {
      //kiem tra username, email, phonenumber, companyName la duy nhat
      for (let i = 0; i < Object.keys(req.payload).length; i++) {
        const _key = Object.keys(req.payload)[i];
        if (utilitiesFunction.isNotEmptyStringValue(req.payload[_key])) {
          let _filter = {};
          _filter[_key] = req.payload[_key];
          const foundUser = await AppUsersResourceAccess.find(_filter, 0, 1);
          if (foundUser && foundUser.length > 0) {
            Logger.info(`${USER_ERROR.DUPLICATED_USER}: ${JSON.stringify(req.payload)}`);
            reject(USER_ERROR.DUPLICATED_USER);
            return; //to make sure everything stop
          }
        }
      }

      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _sendOTPToUserEmail(targetUser) {
  const email = targetUser.email;

  let newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);
  newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);

  if (process.env.EMAIL_OTP_ENABLE * 1 === 1) {
    const EmailClient = require('../../../ThirdParty/Email/EmailClient');
    const EmailGenerator = require('../../../ThirdParty/Email/EmailGenerator');
    let _emailData = EmailGenerator.generateNewOTPEmail(`${targetUser.username}`, newOTP);
    EmailClient.sendEmail(email, _emailData.subject, _emailData.body, _emailData.htmlBody).then(result => {
      if (!result) {
        Logger.error(`SEND_OTP_TO_EMAIL_FAILED ${email}`);
      }
    });
  } else {
    newOTP = `${OTP_MAX_VALUE}`;
  }

  await AppUsersResourceAccess.updateById(targetUser.appUserId, {
    activeOTPCode: newOTP,
    activeOTPAt: new Date().toISOString(),
  });
}

async function sendEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let email = req.payload.email;

      let existEmails = await AppUsersResourceAccess.find({
        email: email,
      });
      if (existEmails && existEmails.length > 0) {
        _sendOTPToUserEmail(existEmails[0]);
        resolve('success');
      } else {
        Logger.error(`insert OTP data error: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function confirmEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let email = req.payload.email;
      let otpCode = req.payload.otp;
      let foundUsers = await AppUsersResourceAccess.find(
        {
          email: email,
        },
        0,
        1,
      );
      if (!foundUsers || foundUsers.length < 1) {
        Logger.error(`error confirm Email OTP invalid email`);
        reject('INVALID EMAIL');
        return; //make sure everything stop
      }

      let foundUser = foundUsers[0];

      let _confirmTime = new Date() - 1;
      let _otpTime = new Date(foundUser.activeOTPAt) - 1;
      const MAX_VALID_DURATION = 5 * 60 * 1000; //5 minutes
      if (foundUser.activeOTPCode === otpCode && _otpTime < _confirmTime && _confirmTime - _otpTime <= MAX_VALID_DURATION) {
        await AppUsersResourceAccess.updateById(foundUser.appUserId, {
          isVerifiedEmail: USER_VERIFY_EMAIL_STATUS.IS_VERIFIED,
        });
        resolve(foundUser);
      } else {
        Logger.error(`error AppUserManager confirmEmailOTP with email ${email}: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function changePasswordviaEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let email = req.payload.email;
      let otpCode = req.payload.otpCode;
      let newPassword = req.payload.newPassword;
      let foundUsers = await AppUsersResourceAccess.find(
        {
          email: email,
        },
        0,
        1,
      );
      if (!foundUsers || foundUsers.length < 1) {
        Logger.error(`error confirm Email OTP invalid email`);
        reject('INVALID_EMAIL');
        return; //make sure everything stop
      }
      let foundUser = foundUsers[0];
      if (foundUser.activeOTPCode === otpCode) {
        let result = AppUsersFunctions.changeUserPassword(foundUser, newPassword);
        if (result) {
          resolve(result);
        } else {
          Logger.error(`error AppUserManager changePasswordviaEmailOTP with email ${email}, otpCode ${otpCode}: `);
          reject('failed');
        }
      } else {
        Logger.error(`error otp code ${otpCode}`);
        reject('OTP_CODE_INVALID');
        return; //make sure everything stop
      }
      return; //make sure everything stop
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function sendPhoneOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let phoneNumber = req.payload.phoneNumber;
      let foundUsers = await AppUsersResourceAccess.find(
        {
          phoneNumber: phoneNumber,
        },
        0,
        1,
      );
      if (!foundUsers || foundUsers.length < 1) {
        Logger.error(`error send phone OTP invalid number`);
        reject('INVALID PHONE NUMBER');
        return; //make sure everything stop
      }
      let foundUser = foundUsers[0];
      _sendOTPToUserPhoneNumber(foundUser);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _sendOTPToUserPhoneNumber(targetUser) {
  const phoneNumber = targetUser.phoneNumber;

  let newOTP = utilitiesFunction.randomInt(OTP_MAX_VALUE);

  if (process.env.STRINGEE_OTP_ENABLE * 1 === 1) {
    newOTP = utilitiesFunction.padLeadingZeros(newOTP, OTP_MAX_CHARACTER);
    const otpClientFunctions = require('../../../ThirdParty/StringeeOTPAPI/StringeeOtpFunctions');
    let sendOtp = await otpClientFunctions.sendVoiceOTP(phoneNumber, newOTP);

    if (sendOtp !== true) {
      Logger.error(`SEND_OTP_TO_PHONENUMBER_FAILED ${phoneNumber}`);
      return; //make sure everything stop
    }
  } else {
    newOTP = `${OTP_MAX_VALUE}`;
  }

  await AppUsersResourceAccess.updateById(targetUser.appUserId, {
    activeOTPCode: newOTP,
    activeOTPAt: new Date().toISOString(),
  });
}

async function confirmPhoneOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let phoneNumber = req.payload.phoneNumber;
      let otpCode = req.payload.otp;
      let foundUsers = await AppUsersResourceAccess.find({ phoneNumber: phoneNumber }, 0, 1);

      if (!foundUsers || foundUsers.length < 1) {
        Logger.error(`error confirm phone OTP invalid phone`);
        reject('INVALID PHONE');
        return; //make sure everything stop
      }

      let foundUser = foundUsers[0];

      let _confirmTime = new Date() - 1;
      let _otpTime = new Date(foundUser.activeOTPAt) - 1;
      const MAX_VALID_DURATION = 5 * 60 * 1000; //5 minutes
      if (foundUser.activeOTPCode === otpCode && _otpTime < _confirmTime && _confirmTime - _otpTime <= MAX_VALID_DURATION) {
        await AppUsersResourceAccess.updateById(foundUser.appUserId, {
          active: 1,
          isVerifiedPhoneNumber: USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED,
        });
        resolve(foundUser);
      } else {
        Logger.error(`error AppUserManager confirmPhoneOTP with phoneNumber ${phoneNumber}, otpCode ${otpCode}: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userRequestUpgradeUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const WalletRecordFunction = require('../../WalletRecord/WalletRecordFunction');
      const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');

      let foundUser = await AppUsersResourceAccess.findById(req.currentUser.appUserId);
      if (foundUser && foundUser.appUserCategoryId != USER_CATEGORY_ID.VIP_USER) {
        let wallet = await WalletResourceAccess.findWalletByUserId(req.currentUser.appUserId, WALLET_TYPE.POINT);
        const agentPurchasePrice = 1000000; // giá tiền mua quyền đại lý 1tr

        if (wallet && wallet.length > 0 && wallet[0].balance >= agentPurchasePrice) {
          let result = await AppUsersResourceAccess.updateById(req.currentUser.appUserId, {
            appUserCategoryId: USER_CATEGORY_ID.VIP_USER,
          });

          if (result) {
            await WalletRecordFunction.decreaseBalance(
              req.currentUser.appUserId,
              WALLET_TYPE.POINT,
              WALLET_RECORD_TYPE.USER_UPGRADE,
              agentPurchasePrice,
            );
            let notifyTitle = 'Mua quyền đại lý thành công';
            let currentTime = moment().format(ERROR.DATETIME_DISPLAY_FORMAT);
            let notifyContent = `Bạn đã mua quyền đại lý thành công vào lúc ${currentTime}`;
            await CustomerMessageFunctions.sendNotificationUser(req.currentUser.appUserId, notifyTitle, notifyContent, undefined);

            // trả tiền hoa hồng cho F0
            const referedUser = await AppUsersResourceAccess.findById(foundUser.referUserId);
            if (referedUser && referedUser.appUserCategoryId == USER_CATEGORY_ID.VIP_USER) {
              const vipLevel = await AppUserMembershipResourceAccess.findById(referedUser.appUserMembershipId);
              if (vipLevel) {
                await WalletRecordFunction.increaseBalance(
                  referedUser.appUserId,
                  WALLET_TYPE.POINT,
                  WALLET_RECORD_TYPE.REFER_BONUS,
                  vipLevel.appUserMembershipBonusPrize,
                );
              }
            }

            resolve(result);
          } else {
            reject(USER_ERROR.NOT_UPGRADED);
          }
        } else {
          reject(USER_ERROR.NOT_UPGRADED);
        }
      } else {
        reject(USER_ERROR.NOT_UPGRADED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(USER_ERROR.NOT_UPGRADED);
    }
  });
}

async function adminCreateVirtualUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = req.payload;
      userData.isVirtualUser = USER_CATEGORY.VIRTUAL_USER;
      userData.isAllowedWithdraw = WITHDRAWAL_REQUEST.NOT_ALLOWED;
      userData.isAllowedDeposit = DEPOSIT_REQUEST.NOT_ALLOWED;

      const newVirtualUser = await AppUsersFunctions.createNewUser(userData);
      if (newVirtualUser) {
        const WalletFunction = require('../../Wallet/WalletFunctions');
        await WalletFunction.createWalletForUser(newVirtualUser.appUserId);
        resolve(newVirtualUser);
      } else {
        reject(ERROR.POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.POPULAR_ERROR.INSERT_FAILED);
    }
  });
}

async function adminBlockWithdrawal(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let updateResult = await AppUsersResourceAccess.updateById(id, {
        isAllowedWithdraw: WITHDRAWAL_REQUEST.NOT_ALLOWED,
      });
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
    }
  });
}

async function adminUnblockWithdrawal(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let updateResult = await AppUsersResourceAccess.updateById(id, {
        isAllowedWithdraw: WITHDRAWAL_REQUEST.ALLOWED,
      });
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
    }
  });
}

async function adminBlockDeposit(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let updateResult = await AppUsersResourceAccess.updateById(id, {
        isAllowedDeposit: DEPOSIT_REQUEST.NOT_ALLOWED,
      });
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
    }
  });
}

async function adminUnblockDeposit(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let updateResult = await AppUsersResourceAccess.updateById(id, {
        isAllowedDeposit: DEPOSIT_REQUEST.ALLOWED,
      });
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
    }
  });
}

async function adminAssignExpert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      const assignResult = await AppUsersFunctions.assignExpert(appUserId);
      if (assignResult) {
        resolve({ code: assignResult, message: `Success To Assign Expert AppUserId: ${appUserId}` });
      } else {
        resolve({ code: -500, message: `Fail To Assign Expert AppUserId: ${appUserId}` });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.POPULAR_ERROR.UPDATE_FAILED);
    }
  });
}

async function adminUnassignExpert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      const unAssignResult = await AppUsersFunctions.unAssignExpert(appUserId);
      if (unAssignResult) {
        resolve({ code: unAssignResult, message: `Success To Unassign Expert AppUserId: ${appUserId}` });
      } else {
        resolve({ code: -500, message: `Fail To Unassign Expert AppUserId: ${appUserId}` });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.UNKNOWN_ERROR);
    }
  });
}

async function userSummaryCurrentRefer(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      let tradeInfoByDay = {
        totalTrade: 0,
        totalAmountBonus: 0,
      };
      //bat dau tu thu 2, ko phai la CN
      const startDate = moment().startOf('isoWeek').format();
      const endDate = moment().endOf('isoWeek').format();
      let f1TradeInfoByWeek = await AppUserFunctions_ReferUser.calculateTotalF1TradeByWeek(currentUser.appUserId, startDate, endDate);

      const startDateByDay = moment().startOf('day').format();
      const endDateByDay = moment().endOf('day').format();
      tradeInfoByDay = await AppUserFunctions_ReferUser.calculateTotalUserReferTradeByDay(
        currentUser.appUserId,
        currentUser.appUserMembershipId,
        startDateByDay,
        endDateByDay,
      );

      let _summaryResult = {
        totalThisWeekReferUserPlayCount: f1TradeInfoByWeek.totalF1Trade, //Tổng số F1 giao dịch (Trong tuần)
        totalThisWeekReferUserPlayAmount: f1TradeInfoByWeek.totalAmountF1Trade, //Điều kiện cấp bậc(Tổng F1 trong tuần)
        totalTodayReferUserPlayCount: tradeInfoByDay.totalTrade, //Tổng số nhà giao dịch 24h
        totalTodayBonus: tradeInfoByDay.totalAmountBonus, //Hoa hồng giao dịch 24h
      };
      resolve(_summaryResult);
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.UNKNOWN_ERROR);
    }
  });
}

async function userSummaryPlayAmount(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      let _summaryResult = [
        { month: moment().add(-5, 'month').format('MM/YYYY'), totalPlayAmount: 0 },
        { month: moment().add(-4, 'month').format('MM/YYYY'), totalPlayAmount: 0 },
        { month: moment().add(-3, 'month').format('MM/YYYY'), totalPlayAmount: 0 },
        { month: moment().add(-2, 'month').format('MM/YYYY'), totalPlayAmount: 0 },
        { month: moment().add(-1, 'month').format('MM/YYYY'), totalPlayAmount: 0 },
        { month: moment().add(0, 'month').format('MM/YYYY'), totalPlayAmount: 0 },
      ];
      const currentMonth = parseInt(moment().format('MM'));
      const functionArr = [];
      let _startMonth = currentMonth > 6 ? currentMonth - 5 : 1;
      //lay ra danh sach cap duoi can phai tinh toan (dua theo % chia duoc, chia bao nhieu cap lay bao nhieu cap)
      let _systemLevelCount = await getSystemUserLevelByMembershipId(currentUser.appUserMembershipId);
      if (_systemLevelCount < 1) {
        return resolve(_summaryResult);
      }

      let _order = {
        key: 'reportMonth',
        value: 'desc',
      };
      const startDate = moment().month(-5).startOf('months').format();
      let _existingReports = await AppUserMonthlyReportResourceAccess.customSearch(
        {
          appUserId: currentUser.appUserId,
        },
        0,
        5,
        startDate,
        undefined,
        undefined,
        _order,
      );

      if (_existingReports && _existingReports.length > 0) {
        _summaryResult = [];
        for (let i = 0; i < _existingReports.length; i++) {
          let totalPlayAmount = 0;

          for (let j = 1; j <= MAX_LEVEL_NUMBER; j++) {
            totalPlayAmount += _existingReports[i][`totalPlayF${j}`] ? _existingReports[i][`totalPlayF${j}`] : 0;
          }
          _summaryResult.push({
            month: moment(_existingReports[i].reportMonth + '', REPORT_MONTH_DATA_FORMAT).format(REPORT_MONTH_DISPLAY_FORMAT),
            totalPlayAmount: totalPlayAmount,
          });
        }
      }
      resolve(_summaryResult);
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.UNKNOWN_ERROR);
    }
  });
}

async function userSummaryBonusAmount(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const bonusType = req.payload.bonusType;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      let startDateSummary = moment(startDate).startOf('days');
      let endDateSummary = moment(endDate).endOf('days');
      let diff = endDateSummary.diff(startDateSummary, 'days');
      diff += 1;
      if (diff > 31) {
        return reject(USER_ERROR.SEARCH_DATE_LIMIT);
      }
      let diffCount = diff * 6;
      let data = await AppUserFunctions_ReferUser.userSummaryBonusAmountByDate(currentUser.appUserId, startDate, endDate, skip, limit);
      resolve({ data: data.summaryResult, total: diffCount });
      // nếu trong query user có ngày hôm nay thì sau khi response cho user thì tiếp tục chạy insert bên dưới
      if (data.isToday) {
        Logger.info(`insert summaryBonusAmount today`);
        let today = moment().endOf('days');
        let date = moment(today).format('YYYY/MM/DD');
        let paymentReports = await PaymentBonusDailyReportView.find({ appUserId: currentUser.appUserId, summaryDate: date });
        if (paymentReports && paymentReports.length > 0) {
          let now = moment();
          let diffUpdate = now.diff(moment(paymentReports[0].updatedAt), 'minutes');
          if (diffUpdate > 5) {
            let bonusAmount = await AppUserFunctions_ReferUser.calculateBonusAmountByDate(currentUser.appUserId, today);
            for (let i = 0; i < paymentReports.length; i++) {
              const paymentReport = paymentReports[i];
              if (bonusAmount && bonusAmount.length > 0) {
                for (let index = 0; index < bonusAmount.length; index++) {
                  if (bonusAmount[index].referLevel == paymentReport.referLevel) {
                    await PaymentBonusDailyReportResourceAccess.updateById(paymentReport.PaymentBonusDailyReportId, bonusAmount[index]);
                    break;
                  }
                }
              }
            }
          }
        }
        Logger.info(`insert summaryBonusAmount today success`);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.UNKNOWN_ERROR);
    }
  });
}

async function userTotalUserReferF1(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const endDate = req.payload.endDate;
      const totalUserReferF1 = await AppUserFunctions_ReferUser.calculateTotalUserReferF1ByDate(currentUser.appUserId, undefined, endDate);
      return resolve({ data: totalUserReferF1 });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalUserReferF1InMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const startDate = moment().startOf('month').format();
      const endDate = moment().endOf('day').format();
      const totalUserReferF1InMonth = await AppUserFunctions_ReferUser.calculateTotalUserReferF1ByDate(currentUser.appUserId, startDate, endDate);
      return resolve({ data: totalUserReferF1InMonth });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalUserReferF1LastMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const startDate = moment().subtract(1, 'months').startOf('month').format();
      const endDate = moment().subtract(1, 'months').endOf('month').format();
      const totalUserReferF1LastMonth = await AppUserFunctions_ReferUser.calculateTotalUserReferF1ByDate(currentUser.appUserId, startDate, endDate);
      return resolve({ data: totalUserReferF1LastMonth });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalUserRefer(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const endDate = req.payload.endDate;
      const totalUserRefer = await AppUserFunctions_ReferUser.calculateTotalUserReferByDate(currentUser.appUserId, undefined, endDate);
      return resolve({ data: totalUserRefer });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalUserReferInMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const startDate = moment().startOf('month').format();
      const endDate = moment().endOf('day').format();
      const totalUserInMonth = await AppUserFunctions_ReferUser.calculateTotalUserReferByDate(currentUser.appUserId, startDate, endDate);
      return resolve({ data: totalUserInMonth });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalUserReferLastMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const startDate = moment().subtract(1, 'months').startOf('month').format();
      const endDate = moment().subtract(1, 'months').endOf('month').format();
      const totalUserReferLastMonth = await AppUserFunctions_ReferUser.calculateTotalUserReferByDate(currentUser.appUserId, startDate, endDate);
      return resolve({ data: totalUserReferLastMonth });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalAgentRefer(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const endDate = req.payload.endDate;
      const totalAgentRefer = await AppUserFunctions_ReferUser.calculateTotalAgentByDate(currentUser.appUserId, undefined, endDate);
      return resolve({ data: totalAgentRefer });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalAgentReferInMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const startDate = moment().startOf('month').format();
      const endDate = moment().endOf('day').format();
      const totalAgentReferInMonth = await AppUserFunctions_ReferUser.calculateTotalAgentByDate(currentUser.appUserId, startDate, endDate);
      return resolve({ data: totalAgentReferInMonth });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalAgentReferLastMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      const startDate = moment().subtract(1, 'months').startOf('month').format();
      const endDate = moment().subtract(1, 'months').endOf('month').format();
      const totalAgentReferLastMonth = await AppUserFunctions_ReferUser.calculateTotalAgentByDate(currentUser.appUserId, startDate, endDate);
      return resolve({ data: totalAgentReferLastMonth });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalReferBonus(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      if (currentUser.appUserMembershipId > LEVER_MEMBERSHIP.MEMBER) {
        const endDate = req.payload.endDate;

        const _totalReferBonus = await PaymentBonusTransactionResourceAccess.customSum(
          { appUserId: currentUser.appUserId },
          undefined,
          endDate,
          'paymentAmount',
        );
        if (_totalReferBonus && _totalReferBonus.length > 0) {
          return resolve({ data: _totalReferBonus[0].sumResult });
        }
      }
      return resolve({ data: 0 });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalReferBonusInMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      if (currentUser.appUserMembershipId > LEVER_MEMBERSHIP.MEMBER) {
        const startDate = moment().startOf('month').format();
        const endDate = moment().endOf('day').format();

        const totalReferBonusInMonth = await PaymentBonusTransactionResourceAccess.customSum(
          { appUserId: currentUser.appUserId },
          startDate,
          endDate,
          'paymentAmount',
        );
        if (totalReferBonusInMonth && totalReferBonusInMonth.length > 0) {
          return resolve({ data: totalReferBonusInMonth[0].sumResult });
        }
      }
      return resolve({ data: 0 });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}

async function userTotalReferBonusLastMonth(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      if (currentUser.appUserMembershipId > LEVER_MEMBERSHIP.MEMBER) {
        const startDate = moment().subtract(1, 'months').startOf('month').format();
        const endDate = moment().subtract(1, 'months').endOf('month').format();

        const totalReferBonusLastMonth = await PaymentBonusTransactionResourceAccess.customSum(
          { appUserId: currentUser.appUserId },
          startDate,
          endDate,
          'paymentAmount',
        );
        if (totalReferBonusLastMonth && totalReferBonusLastMonth.length > 0) {
          return resolve({ data: totalReferBonusLastMonth[0].sumResult });
        }
      }
      return resolve({ data: 0 });
    } catch (e) {
      Logger.error(__filename, e);
      reject(ERROR.NO_DATA);
    }
  });
}
async function blockUserBySupervisorId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let block = req.payload.block;
      let userBranchArr = await AppUsersResourceAccess.find({ supervisorId: appUserId });
      if (userBranchArr) {
        let result = await AppUsersResourceAccess.updateAll({ blockedLogin: block }, { supervisorId: appUserId });
        if (result) {
          resolve(result);
        } else {
          reject(USER_ERROR.USER_UPDATE_FAILED);
        }
      } else {
        reject(USER_ERROR.USER_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  registerUser,
  checkUserName,
  adminUnblockLoginUser,
  adminUnblockWithDrawBank,
  adminUnblockWithDrawCrypto,
  loginUser,
  changePasswordUser,
  verify2FA,
  loginFacebook,
  loginGoogle,
  loginZalo,
  loginApple,
  userUpdateInfo,
  registerUserByPhone,
  registerUserByEmail,
  loginByPhone,
  loginByToken,
  loginByEmail,
  getUsersByMonth,
  uploadBeforeIdentityCard,
  uploadAfterIdentityCard,
  userSubmitIdentity,
  verifyInfoUser,
  rejectInfoUser,
  uploadAvatar,
  exportExcel,
  forgotPassword,
  verifyEmailUser,
  resetPasswordBaseOnUserToken,
  adminResetPassword,
  userGetDetailById,
  sendMailToVerifyEmail,
  forgotPasswordOTP,
  forgotSecondaryPasswordSMSOTP,
  forgotSecondaryPasswordEmailOTP,
  adminChangePasswordUser,
  adminLockUser,
  adminChangeSecondaryPasswordUser,
  userViewsListMembership,
  userSummaryCurrentRefer,
  userSummaryBonusAmount,
  userSummaryPlayAmount,
  findAllUsersFollowingReferId,
  findReferedUserByUserId,
  summaryReferedUserByUserId,
  userCheckExistingAccount,
  sendEmailOTP,
  confirmEmailOTP,
  changePasswordviaEmailOTP,
  userChangeSecondaryPassword,
  sendPhoneOTP,
  confirmPhoneOTP,
  forgotPasswordEmailOTP,
  forgotPasswordSMSOTP,
  userRequestUpgradeUser,
  registerUserByStaffCode,
  registerUserWithOTP,
  adminCreateVirtualUser,
  adminBlockWithdrawal,
  adminBlockDeposit,
  adminUnblockWithdrawal,
  adminUnblockDeposit,
  adminAssignExpert,
  adminUnassignExpert,
  userFindReferedUserByUserId,
  userTotalUserReferF1,
  userTotalUserReferF1InMonth,
  userTotalUserReferF1LastMonth,
  userTotalUserRefer,
  userTotalUserReferInMonth,
  userTotalUserReferLastMonth,
  userTotalAgentRefer,
  userTotalAgentReferInMonth,
  userTotalAgentReferLastMonth,
  userTotalReferBonus,
  userTotalReferBonusInMonth,
  userTotalReferBonusLastMonth,
  blockUserBySupervisorId,
  registerUserWithOTP,
  resetWithdrawCountDay,
};
