/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const OTPRequestResourceAccess = require('./resourceAccess/OTPRequestResourceAccess');

async function validateIPRequestLimit(ipAddress) {
  const existedIP = await OTPRequestResourceAccess.findById(ipAddress);

  // IP đã tồn tại
  if (existedIP) {
    // Kiểm tra xem số lần yêu cầu OTP có vượt quá 10 không
    if (existedIP.attempts >= 10) {
      return false; // Vượt quá thì báo lỗi
    }

    // Không vượt quá 10 thì ++ số lần yêu cầu OTP
    await OTPRequestResourceAccess.updateById(existedIP.ipAddress, {
      attempts: existedIP.attempts + 1,
    });
  } else {
    const requestTime = moment().format('DD/MM/YYYY HH:mm:ss');
    await OTPRequestResourceAccess.insert({
      ipAddress: ipAddress,
      requestTime: requestTime,
      attempts: 1,
    });
  }

  return true;
}

module.exports = {
  validateIPRequestLimit,
};
