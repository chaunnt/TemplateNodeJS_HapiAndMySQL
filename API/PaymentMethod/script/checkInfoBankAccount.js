/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
const { PAYMENT_TYPE, PAYMENT_METHOD_ERROR } = require('../PaymentMethodConstant');
const PaymentMethodResourceAccess = require('../resourceAccess/PaymentMethodResourceAccess');
const { crawlBankAccount } = require('../../../ThirdParty/VietQR/VietQRFunction');
const fs = require('fs');
const path = require('path');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { getBankIdFromShortName } = require('../PaymentMethodFunctions');
const { isNotEmptyStringValue, nonAccentVietnamese } = require('../../ApiUtils/utilFunctions');
async function checkInfoBankAcc() {
  let skip = 0;
  while (true) {
    let paymentMethodArr = await PaymentMethodResourceAccess.find({ paymentMethodType: PAYMENT_TYPE.ATM_BANK }, skip, 50);
    if (paymentMethodArr && paymentMethodArr.length > 0) {
      let result = 'appUserId,userName,name,bankName,accountNumber,note \r\n';
      for (let i = 0; i < paymentMethodArr.length; i++) {
        let paymentMethod = paymentMethodArr[i];
        if (!paymentMethod.appUserId) {
          continue;
        }
        let currentUser = await AppUsersResourceAccess.findById(paymentMethod.appUserId);
        let _bankInfo = getBankIdFromShortName(paymentMethod.paymentMethodName);
        if (!_bankInfo) {
          result += `${paymentMethod.appUserId},${currentUser.username},${currentUser.lastName},${paymentMethod.paymentMethodName}, ${paymentMethod.paymentMethodIdentityNumber}, errorBankAccount \r\n`;
        }
        let realBankData = await crawlBankAccount(paymentMethod.paymentMethodIdentityNumber.trim(), _bankInfo.bin * 1);

        if (realBankData && isNotEmptyStringValue(realBankData.accountName.trim())) {
          if (
            isNotEmptyStringValue(paymentMethod.paymentMethodReceiverName.trim()) === false ||
            nonAccentVietnamese(paymentMethod.paymentMethodReceiverName.trim()).toUpperCase() !==
              nonAccentVietnamese(realBankData.accountName.trim()).toUpperCase()
          ) {
            result += `${paymentMethod.appUserId},${currentUser.username},${currentUser.lastName},${paymentMethod.paymentMethodName},${paymentMethod.paymentMethodIdentityNumber},${PAYMENT_METHOD_ERROR.INVALID_PAYMENT_METHOD_BANK_DATA} \r\n`;
          }
        } else {
          result += `${paymentMethod.appUserId},${currentUser.username},${currentUser.lastName},${paymentMethod.paymentMethodName},${paymentMethod.paymentMethodIdentityNumber},accountNumber is not found \r\n`;
        }
      }
      fs.writeFileSync(path.resolve(__dirname, '../errorBankAccount/errorBankAccount.csv'), result, { encoding: 'utf-8' });
      skip += 50;
    } else {
      break;
    }
  }
}
checkInfoBankAcc();
