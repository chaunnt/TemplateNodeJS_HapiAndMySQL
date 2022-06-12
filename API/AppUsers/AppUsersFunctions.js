/**
 * Created by A on 7/18/17.
 */
'use strict';

const crypto = require("crypto");
const otplib = require('otplib');

const AppUsersResourceAccess = require("./resourceAccess/AppUsersResourceAccess");
const WalletBalanceUnitView = require('../Wallet/resourceAccess/WalletBalanceUnitView');
const WalletResource = require('../Wallet/resourceAccess/WalletResourceAccess');

const QRCodeFunction = require('../../ThirdParty/QRCode/QRCodeFunctions');
const TokenFunction = require('../ApiUtils/token');
const Logger = require('../../utils/logging');
const EmailClient = require('../../ThirdParty/Email/EmailClient');

const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
/** Gọi ra để sử dụng đối tượng "authenticator" của thằng otplib */
const { authenticator } = otplib
const { 
  USER_VERIFY_INFO_STATUS, 
  USER_VERIFY_EMAIL_STATUS, 
  USER_VERIFY_PHONE_NUMBER_STATUS, 
  USER_TYPE,
  USER_ERROR, 
  USER_MEMBER_LEVEL,
} = require("./AppUserConstant");
/** Tạo secret key ứng với từng user để phục vụ việc tạo otp token.
  * Lưu ý: Secret phải được gen bằng lib otplib thì những app như
    Google Authenticator hoặc tương tự mới xử lý chính xác được.
  * Các bạn có thể thử để linh linh cái secret này thì đến bước quét mã QR sẽ thấy có lỗi ngay.
*/
const generateUniqueSecret = () => {
  return authenticator.generateSecret()
}

/** Tạo mã OTP token */
const generateOTPToken = (username, serviceName, secret) => {
  return authenticator.keyuri(username, serviceName, secret)
}

function hashPassword(password) {
  const hashedPassword = crypto
    .createHmac("sha256", "ThisIsSecretKey")
    .update(password)
    .digest("hex");
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
    password: hashedPassword
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId);

    return foundUser
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
    secondaryPassword: hashedPassword
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId);

    return foundUser
  } else {
    return undefined;
  }
}

async function retrieveUserDetail(appUserId) {
  //get user detial
  let user = await AppUsersResourceAccess.find({ appUserId: appUserId });
  if (user && user.length > 0) {
    let foundUser = user[0];
    delete foundUser.password;
    //create new login token
    let token = TokenFunction.createToken(foundUser);
    foundUser.token = token;

    //retrive user wallet info
    let wallets = await WalletBalanceUnitView.find({ appUserId: appUserId });
    if (wallets && wallets.length > 0) {
      foundUser.wallets = wallets;
    }

    //neu la user dai ly thi se co QRCode gioi thieu
    let referLink = process.env.WEB_HOST_NAME + `/register?refer=${foundUser.username}`;
    const QRCodeImage = await QRCodeFunction.createQRCode(referLink);
    if (QRCodeImage) {
      foundUser.referLink = referLink;
      foundUser.referQRCode = `https://${process.env.HOST_NAME}/${QRCodeImage}`;
    }

    return foundUser
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

async function changeUserSecondaryPassword(userData, newPassword) {
  let newHashPassword = hashPassword(newPassword);

  let result = await AppUsersResourceAccess.updateById(userData.appUserId, { secondaryPassword: newHashPassword });

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
    let topSecret = "";
    if (user.twoFACode || (user.twoFACode !== "" && user.twoFACode !== null)) {
      topSecret = user.twoFACode;
    } else {
      topSecret = generateUniqueSecret();
    }

    const otpAuth = generateOTPToken(user.username, serviceName, topSecret)
    const QRCodeImage = await QRCodeFunction.createQRCode(otpAuth)

    if (QRCodeImage) {
      await AppUsersResourceAccess.updateById(appUserId, {
        twoFACode: topSecret,
        twoFAQR: process.env.HOST_NAME + `/User/get2FACode?appUserId=${appUserId}`
      })
      return QRCodeImage;
    }
  }
  return undefined;
}

/** Kiểm tra mã OTP token có hợp lệ hay không
 * Có 2 method "verify" hoặc "check", các bạn có thể thử dùng một trong 2 tùy thích.
*/
const verify2FACode = (token, topSecret) => {
  return authenticator.check(token, topSecret)
}

async function createNewUser(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      let checkUser = await AppUsersResourceAccess.find({ username: userData.username });
      if (checkUser && checkUser.length > 0) {
        reject(ERROR.DUPLICATED_USER);
        return;
      }
      if (userData.email) {
        checkUser = await AppUsersResourceAccess.find({ email: userData.email });
        if (checkUser && checkUser.length > 0) {
          reject(ERROR.DUPLICATED_USER);
          return;
        }
      }
      if (userData.phoneNumber) {
        checkUser = await AppUsersResourceAccess.find({ phoneNumber: userData.phoneNumber });
        if (checkUser && checkUser.length > 0) {
          reject(ERROR.DUPLICATED_USER);
          return;
        }
      }
      
        //hash password
        userData.password = hashPassword(userData.password);
        if(userData.userAvatar ===  null || userData.userAvatar === undefined || userData.userAvatar === "") {
          userData.userAvatar = `https://${process.env.HOST_NAME}/uploads/avatar.png`;
        }

        //if system support for secondary password, (2 step authentication)
        if (userData.secondaryPassword) {
          userData.secondaryPassword = hashPassword(userData.secondaryPassword);
        }

        //check refer user by refer's username
        if (userData.referUser && userData.referUser.trim() !== '') {
          let referUser = await AppUsersResourceAccess.find({username: userData.referUser}, 0, 1);
          if (referUser && referUser.length > 0) {
            userData.referUserId = referUser[0].appUserId;
          } else {
            Logger.info(`invalid refer user ${userData.referUser}`);
            reject(USER_ERROR.INVALID_REFER_USER);
          }
        }
        //create new user
        let addResult = await AppUsersResourceAccess.insert(userData);
        if (addResult === undefined) {
          Logger.info("can not insert user " + JSON.stringify(userData));
          reject(USER_ERROR.DUPLICATED_USER);
        } else {
          let newUserId = addResult[0];
          await generate2FACode(newUserId);

          //Create wallet for user
          let newWalletData =
            [
              {
                appUserId: newUserId,
                walletType: WALLET_TYPE.POINT //vi diem
              },
            ];
          await WalletResource.insert(newWalletData);

          let userDetail = retrieveUserDetail(newUserId);
          resolve(userDetail);
        }
        return;
    } catch (e) {
      Logger.info('AppUserFunctions', e);
      Logger.info("can createNewUser user ", JSON.stringify(userData));
      resolve(undefined);
    }
  });  
}

async function sendEmailToResetPassword(user, userToken, email) {
  let link = `${process.env.LINK_WEB_SITE}/resetPassword?token=${userToken}`;
  let userType = '';
  if (user.userType === USER_TYPE.PERSONAL) {
    userType = 'Cá nhân';
  } else {
    userType = 'Môi giới'
  }
  let emailResult = await EmailClient.sendEmail(email,
    `${process.env.SMTP_EMAIL} - Thông Báo Thay Đổi Mật Khẩu`,
    'ĐẶT LẠI MẬT KHẨU CỦA BẠN',
    `<div style="width: 100%; font-family: Arial, Helvetica, sans-serif;">
      <div style="display: flex; width: 100%; align-items: center; justify-content: center; justify-items: center;">
          <div style="width: 70%;">
              <p>Chào bạn <strong>${user.firstName}</strong></p>
              <div>Bạn đang yêu cầu thay đổi mật khẩu tài khoản <a style="color: blue;" href="">${email}</a></div>
              <div>Loại tài khoản là <strong>${userType}</strong></div>
              <p>Để cấp lại mật khẩu, Vui lòng click vào đường dẫn dưới đây: <strong><a href="${link}" style="color: blue;">Link xác nhận khôi phục mật khẩu</a></strong></p>
              <br />
              <p>Mọi thắc mắc vui lòng liên hệ hòm email: <a href="">${process.env.SMTP_EMAIL}</a> để được hỗ trợ và giải đáp</p>
              <p>Chúc bạn có những trải nghiệm thú vị cùng <a href="${process.env.LINK_WEB_SITE}" style="text-decoration: none; cursor: pointer; color: cadetblue;">fihome.com.vn</a></p>
              <div>Trân trọng,</div>
              <div>Ban quản trị</div>
          </div>
      </div>
    </div>`,
    undefined);
  return emailResult;
}

async function sendEmailToVerifyEmail(user, userToken, email) {
  let link = `${process.env.LINK_WEB_SITE}/verifyEmail?token=${userToken}`;
  let userType = '';
  if (user.userType === USER_TYPE.PERSONAL) {
    userType = 'Cá nhân';
  } else {
    userType = 'Môi giới'
  }
  let emailResult = await EmailClient.sendEmail(email,
    `${process.env.SMTP_EMAIL} - Xác Thực Email Của Bạn`,
    'XÁC THỰC EMAIL CỦA BẠN',
    `<div style="width: 100%; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: flex; width: 100%; align-items: center; justify-content: center; justify-items: center;">
        <div style="width: 70%;">
            <p>Chào bạn <strong>${user.firstName}</strong></p>
            <div>Bạn đang yêu cầu xác thực email <a style="color: blue;" href="">${email}</a></div>
            <div>Loại tài khoản là <strong>${userType}</strong></div>
            <p>Để xác thực email, Vui lòng click vào đường dẫn dưới đây: <strong><a href="${link}" style="color: blue;">Link xác thực email</a></strong></p>
            <br />
            <p>Mọi thắc mắc vui lòng liên hệ hòm email: <a href="">${process.env.SMTP_EMAIL}</a> để được hỗ trợ và giải đáp</p>
            <p>Chúc bạn có những trải nghiệm thú vị cùng <a href="${process.env.LINK_WEB_SITE}" style="text-decoration: none; cursor: pointer; color: cadetblue;">fihome.com.vn</a></p>
            <div>Trân trọng,</div>
            <div>Ban quản trị</div>
        </div>
    </div>
  </div>`,
    undefined);
  return emailResult;
}
module.exports = {
  verifyUniqueUser,
  verifyUserCredentials,
  hashPassword,
  unhashPassword,
  retrieveUserDetail,
  changeUserPassword,
  changeUserSecondaryPassword,
  generate2FACode,
  verify2FACode,
  createNewUser,
  sendEmailToResetPassword,
  sendEmailToVerifyEmail,
  verifyUserSecondaryPassword
}