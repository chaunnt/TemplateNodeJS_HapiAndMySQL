const Logger = require('../../../utils/logging');
const PaymentDepositTransactionResourceAccess = require('../../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
const { approveDepositTransaction } = require('../../PaymentDepositTransaction/PaymentDepositTransactionFunctions');
const { DEPOSIT_TRX_STATUS } = require('../../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const { isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');
const {
  acceptWithdrawRequest,
  updateLastWithdrawForUser,
  rejectWithdrawRequest,
} = require('../../PaymentWithdrawTransaction/PaymentWithdrawTransactionFunctions');
const PaymentWithdrawTransactionResourceAccess = require('../../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');
const { WITHDRAW_TRX_STATUS } = require('../../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
const { updateTotalWithdrawForUser, updateTotalDepositForUser } = require('../../LeaderBoard/LeaderFunction');
const PaymentDepositTransactionFunctions = require('../../PaymentDepositTransaction/PaymentDepositTransactionFunctions');
// webhookReceivePayment({
//   payload: {
//     outTradeNo: 1434,
//     amount: 200000,
//     orderNo: "abc"
//   }
// })
async function webhookReceivePayment(req) {
  try {
    let { outTradeNo, orderNo, type, code, amount, timestamp, notifyUrl, sign, extra, status, userAmount } = req.payload;
    let result = await _checkPaymentAndReturnToSunpay(outTradeNo, orderNo, type, amount);
    return result;
  } catch (e) {
    Logger.error(e);
    return 'failed';
  }
}

async function webhookReceivePaymentUSDT(req) {
  try {
    let { outTradeNo, orderNo, type, code, amount, timestamp, notifyUrl, sign, extra, status, userAmount } = req.payload;
    let result = await _checkPaymentAndReturnToSunpay(outTradeNo, orderNo, type, amount);
    return result;
  } catch (e) {
    Logger.error(e);
    return 'failed';
  }
}
async function webhookReceivePaymentElecWallet(req) {
  try {
    let { outTradeNo, orderNo, type, code, amount, timestamp, notifyUrl, sign, extra, status, userAmount } = req.payload;
    let result = await _checkPaymentAndReturnToSunpay(outTradeNo, orderNo, type, amount);
    return result;
  } catch (e) {
    Logger.error(e);
    return 'failed';
  }
}
async function webhookReceivePayoutPayment(req) {
  try {
    let { outTradeNo, orderNo, amount, status } = req.payload;
    console.log(JSON.stringify(req.payload));
    if (!outTradeNo || isNotEmptyStringValue(outTradeNo) === false) {
      throw 'outTradeNo no data';
    }
    let _paymentWithdrawTransactionId = outTradeNo.split('_');
    if (_paymentWithdrawTransactionId.length <= 1) {
      throw `invalid _paymentWithdrawTransactionId ${_paymentWithdrawTransactionId} from outTradeNo ${outTradeNo}`;
    }
    _paymentWithdrawTransactionId = _paymentWithdrawTransactionId[1];

    let _existingTransaction = await PaymentWithdrawTransactionResourceAccess.findById(_paymentWithdrawTransactionId);
    if (!_existingTransaction) {
      throw 'invalid _paymentDepositTransactionId, no _existingTransaction';
    }
    if (_existingTransaction.paymentStatus !== WITHDRAW_TRX_STATUS.NEW && _existingTransaction.paymentStatus !== WITHDRAW_TRX_STATUS.WAITING) {
      throw `payment ${_paymentWithdrawTransactionId} already paid`;
    }
    if (_existingTransaction.paymentAmount * 1 !== amount * 1) {
      throw `payment ${_paymentWithdrawTransactionId} wrong amount`;
    }
    if (!orderNo) {
      throw 'invalid orderNo';
    }
    const NO_STAFF = undefined;

    if (status * 1 === 1) {
      let approveResult = acceptWithdrawRequest(
        _paymentWithdrawTransactionId,
        `Giao dịch rút tự động, số tiền đã rút là ${amount}`,
        NO_STAFF,
        orderNo,
      );
      if (!approveResult) {
        throw 'failed to approve';
      }

      await updateLastWithdrawForUser(_existingTransaction.appUserId, _existingTransaction.paymentAmount);

      //Update leader board
      await updateTotalWithdrawForUser(_existingTransaction.appUserId);
    } else if (status * 1 === 2) {
      let approveResult = rejectWithdrawRequest(
        _paymentWithdrawTransactionId,
        NO_STAFF,
        `Giao dịch rút tự động hủy, số tiền đã rút là ${amount}, mã lệnh ${outTradeNo}, mã giao dịch ${orderNo}, trạng thái ${status}`,
      );
      if (!approveResult) {
        throw 'failed to approve';
      }
    }

    return 'success';
  } catch (e) {
    Logger.error(e);
    return 'failed';
  }
}
async function _checkPaymentAndReturnToSunpay(outTradeNo, orderNo, type, amount) {
  if (!outTradeNo || isNotEmptyStringValue(outTradeNo) === false) {
    throw 'outTradeNo no data';
  }
  let _paymentDepositTransactionId = outTradeNo.split('_');
  if (_paymentDepositTransactionId.length <= 1) {
    throw `invalid _paymentDepositTransactionId ${_paymentDepositTransactionId} from outTradeNo ${outTradeNo}`;
  }
  _paymentDepositTransactionId = _paymentDepositTransactionId[1];

  let _existingTransaction = await PaymentDepositTransactionResourceAccess.findById(_paymentDepositTransactionId);
  if (!_existingTransaction) {
    throw 'invalid _paymentDepositTransactionId, no _existingTransaction';
  }

  if (_existingTransaction.paymentStatus !== DEPOSIT_TRX_STATUS.NEW) {
    throw `payment ${_paymentDepositTransactionId} already paid`;
  }
  if (type == 'usdt_qr') {
    if (_existingTransaction.paymentRefAmount * 1 !== amount * 1) {
      throw `payment ${_paymentDepositTransactionId} wrong amount`;
    }
  } else {
    if (_existingTransaction.paymentAmount * 1 !== amount * 1) {
      throw `payment ${_paymentDepositTransactionId} wrong amount`;
    }
  }
  if (!orderNo) {
    throw 'invalid orderNo';
  }
  const NO_STAFF = undefined;
  const NO_METHOD = undefined;
  let approveResult = await approveDepositTransaction(
    _paymentDepositTransactionId,
    NO_STAFF,
    `Giao dịch tự động, số tiền thực nhận là ${amount} ${type == 'usdt_qr' ? 'USDT' : ''}`,
    NO_METHOD,
    orderNo,
  );
  if (!approveResult) {
    throw 'failed to approve';
  }
  await PaymentDepositTransactionFunctions.updateFirstDepositForUser(_existingTransaction.appUserId);

  //update leader board
  await updateTotalDepositForUser(_existingTransaction.appUserId);
  return 'success';
}
module.exports = {
  webhookReceivePayment,
  webhookReceivePayoutPayment,
  webhookReceivePaymentUSDT,
  webhookReceivePaymentElecWallet,
};
