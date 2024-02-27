/* Copyright (c) 2021-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const crypto = require('crypto');
const otplib = require('otplib');
const moment = require('moment');

const AppUsersResourceAccess = require('./resourceAccess/AppUsersResourceAccess');
const WalletBalanceUnitView = require('../Wallet/resourceAccess/WalletBalanceUnitView');
const WalletResource = require('../Wallet/resourceAccess/WalletResourceAccess');
const utilitiesFunction = require('../ApiUtils/utilFunctions');
const AppUserExpertInfoResourceAccess = require('../AppUserExperts/resourceAccess/AppUserExpertInfoResourceAccess');

const QRCodeFunction = require('../../ThirdParty/QRCode/QRCodeFunctions');
const TokenFunction = require('../ApiUtils/token');
const Logger = require('../../utils/logging');

const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
/** Gọi ra để sử dụng đối tượng "authenticator" của thằng otplib */
const { authenticator } = otplib;
const { USER_VERIFY_INFO_STATUS, USER_VERIFY_EMAIL_STATUS, USER_VERIFY_PHONE_NUMBER_STATUS, USER_TYPE, USER_ERROR } = require('./AppUserConstant');
const StaffResourceAccess = require('../Staff/resourceAccess/StaffResourceAccess');
const StaffUserResourceAccess = require('../StaffUser/resourceAccess/StaffUserResourceAccess');
const { BET_RESULT } = require('../GamePlayRecords/GamePlayRecordsConstant');
const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const { WITHDRAW_TRX_STATUS } = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
const AppUsersSettingResourceAccess = require('./resourceAccess/AppUsersSettingResourceAccess');
const SummaryUserPaymentDepositTransactionView = require('../PaymentDepositTransaction/resourceAccess/SummaryUserPaymentDepositTransactionView');
const PaymentBonusTransactionResourceAccess = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
const SummaryUserWithdrawTransactionView = require('../PaymentWithdrawTransaction/resourceAccess/SummaryUserWithdrawTransactionView');
const GamePlayRecordsView = require('../GamePlayRecords/resourceAccess/GamePlayRecordsView');
/** Tạo secret key ứng với từng user để phục vụ việc tạo otp token.
  * Lưu ý: Secret phải được gen bằng lib otplib thì những app như
    Google Authenticator hoặc tương tự mới xử lý chính xác được.
  * Các bạn có thể thử để linh linh cái secret này thì đến bước quét mã QR sẽ thấy có lỗi ngay.
*/
const generateUniqueSecret = () => {
  return authenticator.generateSecret();
};

/** Tạo mã OTP token */
const generateOTPToken = (username, serviceName, secret) => {
  return authenticator.keyuri(username, serviceName, secret);
};

async function getUnreadNotificationCount(foundUser) {
  const CustomerMessageResourceAccess = require('../CustomerMessage/resourceAccess/CustomerMessageResourceAccess');
  //lay so luong thong bao chua doc cua user
  let unreadNotifications = await CustomerMessageResourceAccess.count({
    customerId: foundUser.appUserId,
    isRead: 0,
  });
  foundUser.unreadNotifications = unreadNotifications[0].count;
}

function hashPassword(password) {
  const hashedPassword = crypto.createHmac('sha256', 'ThisIsSecretKey').update(password).digest('hex');
  return hashedPassword;
}

function unhashPassword(hash) {
  const pass = cryptr.decrypt(hash);
  return pass;
}

function verifyUniqueUser(req, res) {
  // Find an entry from the database that
  // matches either the email or username
}

async function verifyUserCredentials(username, password) {
  let hashedPassword = hashPassword(password);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await AppUsersResourceAccess.find({
    username: username,
    password: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId, true);

    return foundUser;
  } else {
    return undefined;
  }
}

async function verifyUserSecondaryPassword(username, secondaryPassword) {
  let hashedPassword = hashPassword(secondaryPassword);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await AppUsersResourceAccess.find({
    username: username,
    secondaryPassword: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId);

    return foundUser;
  } else {
    return undefined;
  }
}

async function retrieveUserDetail(appUserId, genereateToken = false) {
  //get user detial
  const AppUserView = require('./resourceAccess/AppUserView');
  let user = await AppUserView.find({ appUserId: appUserId }, 0, 1);
  if (user && user.length > 0) {
    let foundUser = user[0];
    delete foundUser.password;
    if (genereateToken) {
      //create new login token
      let token = TokenFunction.createToken(foundUser);
      //neu user da verify thi moi tra ve token
      if (process.env.DISABLE_LOCK_NOT_VERIFIED_USER) {
        if (foundUser && foundUser.isVerified) {
          foundUser.token = token;
        }
      } else {
        foundUser.token = token;
      }
    }

    //retrive user wallet info
    let wallets = await WalletResource.find({ appUserId: appUserId });
    if (wallets && wallets.length > 0) {
      foundUser.wallets = wallets;
    }

    //neu la user dai ly thi se co QRCode gioi thieu
    let referLink = process.env.WEB_HOST_NAME + `/register?refer=${foundUser.referCode}`;
    const QRCodeImage = await QRCodeFunction.createQRCode(referLink);
    if (QRCodeImage) {
      foundUser.referLink = referLink;
      foundUser.referQRCode = `https://${process.env.HOST_NAME}/${QRCodeImage}`;
    }

    //lay so luong thong bao chua doc cua user
    await getUnreadNotificationCount(foundUser);
    await _getWithdrawCount(foundUser);
    return foundUser;
  }
  return undefined;
}

async function changeUserPassword(userData, newPassword) {
  let newHashPassword = hashPassword(newPassword);

  let result = await AppUsersResourceAccess.updateById(userData.appUserId, { password: newHashPassword });

  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function generate2FACode(appUserId) {
  // đây là tên ứng dụng của các bạn, nó sẽ được hiển thị trên app Google Authenticator hoặc Authy sau khi bạn quét mã QR
  const serviceName = process.env.HOST_NAME || 'trainingdemo.makefamousapp.com';

  let user = await AppUsersResourceAccess.find({ appUserId: appUserId });

  if (user && user.length > 0) {
    user = user[0];

    // Thực hiện tạo mã OTP
    let topSecret = '';
    if (user.twoFACode || (user.twoFACode !== '' && user.twoFACode !== null)) {
      topSecret = user.twoFACode;
    } else {
      topSecret = generateUniqueSecret();
    }

    const otpAuth = generateOTPToken(user.username, serviceName, topSecret);
    const QRCodeImage = await QRCodeFunction.createQRCode(otpAuth);

    if (QRCodeImage) {
      await AppUsersResourceAccess.updateById(appUserId, {
        twoFACode: topSecret,
        twoFAQR: process.env.HOST_NAME + `/User/get2FACode?appUserId=${appUserId}`,
      });
      return QRCodeImage;
    }
  }
  return undefined;
}

/** Kiểm tra mã OTP token có hợp lệ hay không
 * Có 2 method "verify" hoặc "check", các bạn có thể thử dùng một trong 2 tùy thích.
 */
const verify2FACode = (token, topSecret) => {
  return authenticator.check(token, topSecret);
};

async function createNewUser(userData, staffId) {
  return new Promise(async (resolve, reject) => {
    //check existed username
    let _existedUsers = await AppUsersResourceAccess.find({ username: userData.username });
    if (_existedUsers && _existedUsers.length > 0) {
      if (_existedUsers[0].active === 0) {
        let userDetail = retrieveUserDetail(_existedUsers.appUserId);
        resolve(userDetail);
      } else {
        Logger.error(`error create new user`);
        reject(USER_ERROR.DUPLICATED_USER);
        return;
      }
    }

    if (userData.firstName) {
      _existedUsers = await AppUsersResourceAccess.find({ firstName: userData.firstName });
      if (_existedUsers && _existedUsers.length > 0) {
        Logger.error(`error duplicated user firstname`);
        reject(USER_ERROR.DUPLICATED_USER_FIRSTNAME);
        return;
      }
    }

    //check existed email
    if (userData.email) {
      _existedUsers = await AppUsersResourceAccess.find({ email: userData.email });
      if (_existedUsers && _existedUsers.length > 0) {
        Logger.error(`error duplicated user email`);
        reject(USER_ERROR.DUPLICATED_USER_EMAIL);
        return;
      }
    }

    //check existed phoneNumber
    if (userData.phoneNumber) {
      _existedUsers = await AppUsersResourceAccess.find({ phoneNumber: userData.phoneNumber });
      if (_existedUsers && _existedUsers.length > 0) {
        Logger.error(`error duplicated user phone`);
        reject(USER_ERROR.DUPLICATED_USER_PHONE);
        return;
      }
    }
    //check existed referUserId
    if (userData.referUserId) {
      const _existedReferUserId = await AppUsersResourceAccess.find({ appUserId: userData.referUserId });
      if (_existedReferUserId.length === 0) {
        Logger.error(`error refer user not found`);
        reject(USER_ERROR.REFER_USER_NOT_FOUND);
        return;
      }

      userData.referUser = _existedReferUserId[0].username;
    }

    //hash password
    userData.password = hashPassword(userData.password);
    if (userData.userAvatar === null || userData.userAvatar === undefined || userData.userAvatar === '') {
      userData.userAvatar = `https://${process.env.HOST_NAME}/uploads/avatar.png`;
    }

    //if system support for secondary password, (2 step authentication)
    if (userData.secondaryPassword) {
      userData.secondaryPassword = hashPassword(userData.secondaryPassword);
    }

    //check refer user by refer's username
    if (userData.referUser && userData.referUser.trim() !== '') {
      let referUser = await AppUsersResourceAccess.find({ username: userData.referUser }, 0, 1);
      if (referUser && referUser.length > 0) {
        userData.referUserId = referUser[0].appUserId;
        let dataUserF = await _CheckUserF(userData.referUserId);
        if (dataUserF && dataUserF.length > 0) {
          if (dataUserF[0] !== undefined) {
            userData.memberReferIdF1 = dataUserF[0].appUserId;
            userData.supervisorId = dataUserF[0].supervisorId;
          }
          if (dataUserF[1] !== undefined) {
            userData.memberReferIdF2 = dataUserF[1].appUserId;
            userData.supervisorId = dataUserF[1].supervisorId;
          }
          if (dataUserF[2] !== undefined) {
            userData.memberReferIdF3 = dataUserF[2].appUserId;
            userData.supervisorId = dataUserF[2].supervisorId;
          }
          if (dataUserF[3] !== undefined) {
            userData.memberReferIdF4 = dataUserF[3].appUserId;
            userData.supervisorId = dataUserF[3].supervisorId;
          }
          if (dataUserF[4] !== undefined) {
            userData.memberReferIdF5 = dataUserF[4].appUserId;
            userData.supervisorId = dataUserF[4].supervisorId;
          }
          if (dataUserF[5] !== undefined) {
            userData.memberReferIdF6 = dataUserF[5].appUserId;
            userData.supervisorId = dataUserF[5].supervisorId;
          }
        }
      } else {
        Logger.info(`invalid refer user ${userData.referUser}`);
        reject(USER_ERROR.INVALID_REFER_USER);
        return; //make sure everything stop
      }
    }

    //check refer user by refer's username
    if (userData.referCode && userData.referCode.trim() !== '' && !staffId) {
      let referUser = await AppUsersResourceAccess.find({ referCode: userData.referCode }, 0, 1);
      if (referUser && referUser.length > 0) {
        userData.referUserId = referUser[0].appUserId;
        userData.referUser = referUser[0].username;
        let dataUserF = await _CheckUserF(userData.referUserId);
        if (dataUserF && dataUserF.length > 0) {
          if (dataUserF[0] !== undefined) {
            userData.memberReferIdF1 = dataUserF[0].appUserId;
            userData.supervisorId = dataUserF[0].supervisorId;
            userData.staffId = dataUserF[0].staffId;
          }
          if (dataUserF[1] !== undefined) {
            userData.memberReferIdF2 = dataUserF[1].appUserId;
            userData.supervisorId = dataUserF[1].supervisorId;
            userData.staffId = dataUserF[1].staffId;
          }
          if (dataUserF[2] !== undefined) {
            userData.memberReferIdF3 = dataUserF[2].appUserId;
            userData.supervisorId = dataUserF[2].supervisorId;
            userData.staffId = dataUserF[2].staffId;
          }
          if (dataUserF[3] !== undefined) {
            userData.memberReferIdF4 = dataUserF[3].appUserId;
            userData.supervisorId = dataUserF[3].supervisorId;
            userData.staffId = dataUserF[3].staffId;
          }
          if (dataUserF[4] !== undefined) {
            userData.memberReferIdF5 = dataUserF[4].appUserId;
            userData.supervisorId = dataUserF[4].supervisorId;
            userData.staffId = dataUserF[4].staffId;
          }
          if (dataUserF[5] !== undefined) {
            userData.memberReferIdF6 = dataUserF[5].appUserId;
            userData.supervisorId = dataUserF[5].supervisorId;
            userData.staffId = dataUserF[5].staffId;
          }
        }
      } else {
        referUser = undefined;
      }

      if (!referUser) {
        referUser = await StaffResourceAccess.find({ referCode: userData.referCode }, 0, 1);
        if (referUser && referUser.length > 0) {
          userData.staffId = referUser[0].staffId;
          userData.referUser = referUser[0].username;
        } else {
          referUser = undefined;
        }
      }
    }

    //create new user
    let addResult = await AppUsersResourceAccess.insert(userData);
    if (addResult === undefined) {
      Logger.info('can not insert user ' + JSON.stringify(userData));
      reject(USER_ERROR.DUPLICATED_USER);
    } else {
      let newUserId = addResult[0];

      //gán user với staff
      let supervisorId = newUserId;
      if (userData.supervisorId) {
        supervisorId = userData.supervisorId;
      }

      if (userData.staffId) {
        await StaffUserResourceAccess.insert({
          staffId: userData.staffId,
          appUserId: newUserId,
        });
        supervisorId = null;
      }

      await generate2FACode(newUserId);

      let referCode = encodeReferCode(newUserId);
      let _existingReferCode = await AppUsersResourceAccess.find({ referCode: referCode }, 0, 1);
      while (_existingReferCode && _existingReferCode.length > 0) {
        referCode = encodeReferCode(newUserId);
        _existingReferCode = await AppUsersResourceAccess.find({ referCode: referCode }, 0, 1);
      }
      await AppUsersResourceAccess.updateById(newUserId, {
        referCode: referCode,
        isVerifiedEmail: USER_VERIFY_EMAIL_STATUS.IS_VERIFIED,
        supervisorId: supervisorId,
      });

      let userDetail = await retrieveUserDetail(newUserId);
      resolve(userDetail);
    }
    return;
  });
}

async function _CheckUserF(referUserId) {
  let resultArr = [];
  let result = await _checkIdUser(referUserId, resultArr);
  return result;
}
async function _checkIdUser(referUserId, resultArr) {
  if (referUserId !== null && referUserId) {
    let result = await AppUsersResourceAccess.findById(referUserId);
    if (result) {
      resultArr.push({ appUserId: result.appUserId, supervisorId: result.supervisorId, staffId: result.staffId });
      await _checkIdUser(result.referUserId, resultArr);
    }
  }
  return resultArr;
}

async function _calculateTodayUserTransaction(user) {
  let today = moment().startOf('day').format();

  return await _calculateUserTransaction(user, today);
}

async function _calculateUserTransaction(user, startDate, endDate) {
  let outputResult = {
    totalDeposit: 0,
    totalWithdraw: 0,
    totalReWard: 0,
    totalPlaceOrder: 0,
    totalWin: 0,
    totalLose: 0,
    totalBet: 0,
    totalProfit: 0,
  };
  const DepositResource = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
  let totalDeposit = await DepositResource.customSum(
    'paymentAmount',
    {
      appUserId: user.appUserId,
      paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
    },
    startDate,
    endDate,
  );
  if (totalDeposit && totalDeposit.length > 0 && totalDeposit[0].sumResult !== null) {
    outputResult.totalDeposit = totalDeposit[0].sumResult;
  }

  const WithdrawResource = require('../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');
  let totalWithdraw = await WithdrawResource.customSum(
    'paymentAmount',
    {
      appUserId: user.appUserId,
      paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
    },
    undefined,
    undefined,
    startDate,
    endDate,
  );

  if (totalWithdraw && totalWithdraw.length > 0 && totalWithdraw[0].sumResult !== null) {
    outputResult.totalWithdraw = totalWithdraw[0].sumResult;
  }

  const BetRecordResourceAccess = require('../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
  let totalWin = await BetRecordResourceAccess.sumaryWinLoseAmount(startDate, endDate, {
    appUserId: user.appUserId,
    betRecordResult: BET_RESULT.WIN,
  });
  if (totalWin && totalWin.length > 0 && totalWin[0].sumResult !== null) {
    outputResult.totalWin = totalWin[0].sumResult;
  }

  let totalLose = await BetRecordResourceAccess.sumaryWinLoseAmount(startDate, endDate, {
    appUserId: user.appUserId,
    betRecordResult: BET_RESULT.LOSE,
  });
  if (totalLose && totalLose.length > 0 && totalLose[0].sumResult !== null) {
    outputResult.totalLose = totalLose[0].sumResult;
  }

  let totalBet = await BetRecordResourceAccess.customSum(
    'betRecordAmountIn',
    {
      appUserId: user.appUserId,
    },
    startDate,
    endDate,
  );
  if (totalBet && totalBet.length > 0 && totalBet[0].sumResult !== null) {
    outputResult.totalBet = totalBet[0].sumResult;
  }

  outputResult.totalProfit = outputResult.totalWin + outputResult.totalLose;

  return outputResult;
}

async function retrieveUserTransaction(user) {
  user.totalDeposit = 0;
  user.totalWithdraw = 0;
  user.totalWin = 0;
  user.totalLose = 0;
  user.totalBet = 0;
  user.totalTodayDeposit = 0;
  user.totalTodayWithdraw = 0;
  user.totalTodayBet = 0;
  user.totalTodayWin = 0;
  user.totalTodayLose = 0;
  user.totalTodayProfit = 0;

  let totalTransaction = await _calculateUserTransaction(user);
  user.totalDeposit = totalTransaction.totalDeposit;
  user.totalWithdraw = totalTransaction.totalWithdraw;
  user.totalReWard = totalTransaction.totalReWard;
  user.totalPlaceOrder = totalTransaction.totalPlaceOrder;
  user.totalWin = totalTransaction.totalWin;
  user.totalLose = totalTransaction.totalLose;
  user.totalBet = totalTransaction.totalBet;
  user.totalProfit = totalTransaction.totalProfit;

  let todayTotalTransaction = await _calculateTodayUserTransaction(user);
  user.totalTodayDeposit = todayTotalTransaction.totalDeposit;
  user.totalTodayWithdraw = todayTotalTransaction.totalWithdraw;
  user.totalTodayWin = todayTotalTransaction.totalWin;
  user.totalTodayLose = todayTotalTransaction.totalLose;
  user.totalTodayBet = todayTotalTransaction.totalBet;
  user.totalTodayProfit = todayTotalTransaction.totalProfit;

  return user;
}

const base35Chars = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
];

function encodeReferCode(appUserId) {
  let result = '';
  while (appUserId > 0) {
    const remainder = appUserId % base35Chars.length;
    result = base35Chars[remainder] + result;
    appUserId = Math.floor(appUserId / base35Chars.length);
  }
  if (appUserId > 999999) {
    return utilitiesFunction.padLeadingZeros(result, 8);
  } else if (appUserId > 99999) {
    return utilitiesFunction.padLeadingZeros(result, 6);
  } else {
    return utilitiesFunction.padLeadingZeros(result, 5);
  }
}

function decodeReferCode(referCode) {
  let result = 0;
  const base = base35Chars.length;

  for (let i = 0; i < referCode.length; i++) {
    const char = referCode.charAt(i);
    const charValue = base35Chars.indexOf(char);

    if (charValue === -1) {
      throw new Error(`Invalid character '${char}' in decodeReferCode.`);
    }

    result = result * base + charValue;
  }

  let appUserId = result;
  return appUserId;
}

async function assignExpert(appUserId) {
  const appUser = await AppUsersResourceAccess.findById(appUserId);
  if (!appUser) {
    return null;
  }
  const experts = await AppUserExpertInfoResourceAccess.find({ appUserId: appUserId }, 0, 1);
  if (experts && experts.length > 0) {
    const expert = experts[0];

    await AppUsersResourceAccess.updateById(appUserId, {
      isExpert: USER_TYPE.EXPERT,
    });
    const updateResult = await AppUserExpertInfoResourceAccess.updateById(expert.appUserId, { isActive: 1 });
    return updateResult;
  } else {
    let _insertData = {
      appUserId: appUserId,
    };
    const insertResult = await AppUserExpertInfoResourceAccess.insert(_insertData);
    return insertResult;
  }
}

async function unAssignExpert(appUserId) {
  const appUser = await AppUsersResourceAccess.findById(appUserId);
  if (!appUser) {
    return null;
  }
  const experts = await AppUserExpertInfoResourceAccess.find({ appUserId }, 0, 1);
  if (experts && experts.length > 0) {
    const expert = experts[0];

    await AppUsersResourceAccess.updateById(appUserId, {
      isExpert: USER_TYPE.NOMAL,
    });
    const updateResult = await AppUserExpertInfoResourceAccess.updateAllById(expert.appUserId, { isActive: 0 });
    return updateResult;
  } else {
    return null;
  }
}

async function changeUserSecondaryPassword(userData, newPassword, oldPassword) {
  let newHashPassword = hashPassword(newPassword);
  if (oldPassword && oldPassword !== null && oldPassword !== '') {
    let oldPasswordHash = hashPassword(oldPassword);
    if (oldPasswordHash !== userData.secondaryPassword) {
      return -1;
    }
  }

  let result = await AppUsersResourceAccess.updateById(userData.appUserId, { secondaryPassword: newHashPassword });

  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function _getWithdrawCount(foundUser) {
  let userSetting = await AppUsersSettingResourceAccess.findById(foundUser.appUserId);
  foundUser.withdrawCount = 0;
  if (userSetting) {
    foundUser.withdrawCount = userSetting.withdrawCount;
  }
}

async function countReferedUser(dataUser, currentUser) {
  const [
    totalDeposit,
    totalWithdraw,
    totalBetRecordAmountIn,
    totalBetRecordAmountWin,
    totalBonus,
    totalF1UserCount,
    totalSystemUserCount,
    sumSystemBetAmountIn,
  ] = await Promise.all([
    SummaryUserPaymentDepositTransactionView.find({
      appUserId: dataUser.appUserId,
    }),
    SummaryUserWithdrawTransactionView.find({
      appUserId: dataUser.appUserId,
    }),
    GamePlayRecordsView.sum('betRecordAmountIn', {
      appUserId: dataUser.appUserId,
    }),
    GamePlayRecordsView.sum('betRecordWin', {
      appUserId: dataUser.appUserId,
    }),
    PaymentBonusTransactionResourceAccess.customSum({ referUserId: dataUser.appUserId, appUserId: currentUser.appUserId }),
    AppUsersResourceAccess.count({ memberReferIdF1: dataUser.appUserId }),
    AppUsersResourceAccess.customCountByUserMembership(dataUser.appUserId, 6),
    GamePlayRecordsView.sumReferedUserByUserMembership('betRecordAmountIn', dataUser.appUserId, 6),
  ]);
  delete dataUser.password;
  delete dataUser.secondaryPassword;
  delete dataUser.twoFACode;

  dataUser.totalDeposit = totalDeposit && totalDeposit.length > 0 ? totalDeposit[0].totalSum : 0;
  dataUser.totalWithdraw = totalWithdraw && totalWithdraw.length > 0 ? totalWithdraw[0].totalSum : 0;
  dataUser.totalBetRecordAmountIn = totalBetRecordAmountIn && totalBetRecordAmountIn.length > 0 ? totalBetRecordAmountIn[0].sumResult : 0;
  dataUser.totalBetRecordAmountWin = totalBetRecordAmountWin && totalBetRecordAmountWin.length > 0 ? totalBetRecordAmountWin[0].sumResult : 0;
  dataUser.totalBonus = totalBonus && totalBonus.length > 0 ? totalBonus[0].sumResult : 0;
  dataUser.totalF1UserCount = totalF1UserCount && totalF1UserCount.length > 0 ? totalF1UserCount[0].count : 0;
  dataUser.totalSystemUserCount = totalSystemUserCount && totalSystemUserCount.length > 0 ? totalSystemUserCount[0].count : 0;
  dataUser.sumSystemBetAmountIn = sumSystemBetAmountIn && sumSystemBetAmountIn.length > 0 ? sumSystemBetAmountIn[0].sumResult : 0;

  return dataUser;
}

module.exports = {
  verifyUniqueUser,
  verifyUserCredentials,
  hashPassword,
  unhashPassword,
  retrieveUserDetail,
  changeUserPassword,
  generate2FACode,
  verify2FACode,
  createNewUser,
  verifyUserSecondaryPassword,
  getUnreadNotificationCount,
  retrieveUserTransaction,
  encodeReferCode,
  decodeReferCode,
  assignExpert,
  unAssignExpert,
  changeUserSecondaryPassword,
  countReferedUser,
};
