/* Copyright (c) 2022-2024 Reminano */

const Logger = require('../../../utils/logging');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const StatisticalFunctions = require('../StatisticalFunctions');

const { USER_VERIFY_INFO_STATUS } = require('../../AppUsers/AppUserConstant');
const WithdrawTransactionUserView = require('../../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const StatisticalResource = require('../resourceAccess/StatisticalResourceAccess');
const moment = require('moment');
const { DEPOSIT_TRX_STATUS } = require('../../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const { WITHDRAW_TRX_STATUS } = require('../../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
const { ROLE_NAME } = require('../../StaffRole/StaffRoleConstants');
const StaffUserResourceAccess = require('../../StaffUser/resourceAccess/StaffUserResourceAccess');
const { BET_RESULT } = require('../../GamePlayRecords/GamePlayRecordsConstant');

async function generalReport(req) {
  let endDate = req.payload.endDate;
  let startDate = req.payload.startDate;
  let startDay = moment().startOf('days').format();
  let endDay = moment().endOf('days').format();
  let yesterday = moment().add(-1, 'day').format('YYYY/MM/DD');
  let beforeYesterday = moment().add(-2, 'day').format('YYYY/MM/DD');
  return new Promise(async (resolve, reject) => {
    let reportData = {
      totalUsers: 0, //<< tong so luong user
      totalUsersByDate: 0, //<< tong so luong user theo ngay
      totalNewUsers: 0, //<< tong so luong new user
      totalUserPaymentDepositAmount: 0, //<< tong so tien nap cua user
      totalUserPaymentWithdrawAmount: 0, //<< tong so tien rut cua user
      totalUserPaymentDepositAmountVND: 0, //<< tong so tien nap VND cua user
      totalUserPaymentDepositAmountUSDT: 0, //<< tong so tien nap USDT cua user
      totalUserPaymentWithdrawAmountVND: 0, //<< tong so tien rut VND cua user
      totalUserPaymentWithdrawAmountUSDT: 0, //<< tong so tien rut USDT cua user
      totalUserPlaceBet: 0, //<< tong so tien user da choi
      totalUserPlayWinAmount: 0, //<< tổng thắng
      totalUserPlayLoseAmount: 0, //<< tổng thua
      totalUserPlayProfitAmount: 0, //<< tổng lợi nhuận từ khách chơi
      totalUserDeposit: 0, // tong so tai khoan nap tien - mỗi tk tính nạp 1 lần
      totalUserDepositInDay: 0, // tổng tài khoản nạp trong ngày - mỗi tk tính nạp 1 lần
      totalNewUserDepositInDay: 0, // tổng tài khoản nạp lần đầu trong ngày
      totalUserWithdraw: 0, // tong so tai khoan rut tien - mỗi tk tính rut 1 lần
      totalUserWithdrawInDay: 0, // tổng tài khoản rút trong ngày - mỗi tk tính rut 1 lần
      totalNewUserWithdrawInDay: 0, // tổng tài khoản rút lần đầu trong ngày
      totalUserMission: 0, // tổng số tài khoản làm nhiệm vụ - mỗi tk tính làm nv 1 lần
      totalUserMissionInDay: 0, // tổng số tài khoản làm nhiệm vụ trong ngày
      totalNewUserMissionInDay: 0, // tổng số tài khoản làm nhiệm vụ lần đầu trong ngày
      totalMisionBonus: 0, // tổng chi bonus nhiệm vụ
    };
    try {
      let promiseList = [];
      let _currentStaffId = undefined;
      if (req.payload.filter && req.payload.filter.staffId) {
        _currentStaffId = req.payload.filter.staffId;
        console.log('_currentStaffId1: ', _currentStaffId);
      }
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN && req.currentUser.staffRoleId != ROLE_NAME.OPERATOR) {
        _currentStaffId = req.currentUser.staffId;
        console.log('_currentStaffId2: ', _currentStaffId);
      }
      const filter = {};

      filter.staffId = _currentStaffId;

      let statistical = {
        totalUsers: 0,
        totalUserDeposit: 0,
        totalUserWithdraw: 0,
        totalUserMission: 0,
        totalMisionBonus: 0,
        totalUsersByDate: 0,
      };
      if (!_currentStaffId) {
        let statisticalData = await StatisticalResource.find({ date: yesterday });
        if (statisticalData && statisticalData.length > 0) {
          statistical = statisticalData[0];
        } else {
          let statisticalDataBefore = await StatisticalResource.find({ date: beforeYesterday });
          statistical = statisticalDataBefore[0];
        }
      }
      //tổng tài khoản đăng ký theo ngày
      let promisetotalUsers = StatisticalFunctions.countTotalStaffUser(_currentStaffId, startDay, endDay);
      promiseList.push(promisetotalUsers);

      //tổng tài khoản đăng ký trong ngày
      let promisetotalNewUsers = StatisticalFunctions.countTotalNewUsers(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalNewUsers);

      //tổng tiền nạp theo ngày
      let promisetotalUserPaymentDepositAmount = StatisticalFunctions.sumTotalUserPaymentDeposit(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserPaymentDepositAmount);

      //tổng tiền rút theo ngày
      let promisetotalUserPaymentWithdrawAmount = StatisticalFunctions.sumTotalUserPaymentWithdraw(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserPaymentWithdrawAmount);

      //tổng chơi theo ngày
      let promisetotalUserPlaceBet = StatisticalFunctions.sumTotalUserPlaceBet('betRecordAmountIn', { staffId: _currentStaffId }, startDate, endDate);
      promiseList.push(promisetotalUserPlaceBet);

      //tổng tài khoản đã nạp tiền
      //2. "Tổng tài khoản nạp tiền" lưu ý: mỗi tk chỉ được tính 1 lần duy nhất, đó là lần nạp đầu tiên
      let promisetotalUserDeposit = StatisticalFunctions.countTotalUserDeposit(_currentStaffId, startDay, endDay);
      promiseList.push(promisetotalUserDeposit);

      //tổng tài khoản nạp trong ngày
      let promisetotalUserDepositInDay = StatisticalFunctions.countTotalUserDepositByDate(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserDepositInDay);

      //tổng tài khoản nạp lần đầu trong ngày
      let promisetotalNewUserDepositInDay = StatisticalFunctions.countTotalNewUserDeposit(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalNewUserDepositInDay);

      //"Tổng tài khoản rút tiền" lưu ý: cũng 1 tk được tính 1 lần duy nhất,
      //cả khi họ chưa nạp tiền, nhưng họ có tiền hoa hồng từ NV,
      //mà họ rút thì tk đó cũng được tính và chỉ 1 lần duy nhất
      let promisetotalUserWithdraw = StatisticalFunctions.countTotalUserWithdraw(_currentStaffId, startDay, endDay);
      promiseList.push(promisetotalUserWithdraw);

      //tổng tài khoản rút trong ngày
      let promisetotalUserWithdrawInDay = StatisticalFunctions.countTotalUserWithdrawByDate(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserWithdrawInDay);

      //tổng tài khoản rút lần đầu trong ngày
      let promisetotalNewUserWithdrawInDay = StatisticalFunctions.countTotalNewUserWithdraw(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalNewUserWithdrawInDay);

      //tổng tài khoản làm nhiệm vụ
      //4. "Tổng tài khoản làm nhiệm vụ" mỗi tk mà hoàn thành 1 nhiệm vụ đầu tiên là được tính là 1
      //và mỗi tk chỉ được tính vào đây duy nhất 1 lần
      let promisetotalUserMissionCompleted = StatisticalFunctions.countTotalUserMissionCompletedByDate(_currentStaffId, startDay, endDay);
      promiseList.push(promisetotalUserMissionCompleted);

      //tổng tài khoản làm nhiệm vụ trong ngày
      let promisetotalUserMissionCompletedInDay = StatisticalFunctions.countTotalUserMissionCompleted(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserMissionCompletedInDay);

      //tổng tài khoản làm nhiệm vụ lần đầu trong ngày
      let promisetotalNewUserMissionCompletedInDay = StatisticalFunctions.countTotalNewUserMissionCompleted(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalNewUserMissionCompletedInDay);

      // tổng chi bonus nhiệm vụ
      let promiseSumTotalAmountMissionCompleted = StatisticalFunctions.sumTotalAmountMissionCompleted(_currentStaffId, startDay, endDay);
      promiseList.push(promiseSumTotalAmountMissionCompleted);

      //tổng tài khoản đăng ký
      ////1. "Tổng tài khoản đăng ký" thì sẽ biết từ trước đến hiện tjai được bao nhiêu tk đk rồi
      let promisetotalUsersByDate = StatisticalFunctions.countTotalUser(_currentStaffId, startDay, endDay);
      promiseList.push(promisetotalUsersByDate);

      //tổng chơi thắng
      let promisetotalUserPlayWinAmount = StatisticalFunctions.sumTotalUserPlaceBet(
        'betRecordWin',
        { staffId: _currentStaffId, betRecordResult: BET_RESULT.WIN },
        startDate,
        endDate,
      );
      promiseList.push(promisetotalUserPlayWinAmount);

      //tổng chơi thua
      let promisetotalUserPlayLoseAmount = StatisticalFunctions.sumTotalUserPlaceBet(
        'betRecordWin',
        { staffId: _currentStaffId, betRecordResult: BET_RESULT.LOSE },
        startDate,
        endDate,
      );
      promiseList.push(promisetotalUserPlayLoseAmount);

      //tổng tiền nạp theo ngày
      let promisetotalUserPaymentDepositAmountUSDT = StatisticalFunctions.sumTotalUserPaymentDepositUSDT(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserPaymentDepositAmountUSDT);

      //tổng tiền rút theo ngày
      let promisetotalUserPaymentWithdrawAmountUSDT = StatisticalFunctions.sumTotalUserPaymentWithdrawUSDT(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserPaymentWithdrawAmountUSDT);

      //tổng tiền nạp theo ngày
      let promisetotalUserPaymentDepositAmountVND = StatisticalFunctions.sumTotalUserPaymentDepositVND(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserPaymentDepositAmountVND);

      //tổng tiền rút theo ngày
      let promisetotalUserPaymentWithdrawAmountVND = StatisticalFunctions.sumTotalUserPaymentWithdrawVND(_currentStaffId, startDate, endDate);
      promiseList.push(promisetotalUserPaymentWithdrawAmountVND);

      Promise.all(promiseList).then(values => {
        reportData.totalUsers = values[0] * 1 + statistical.totalUsers * 1;
        reportData.totalNewUsers = values[1];
        reportData.totalUserPaymentDepositAmount = values[2];
        reportData.totalUserPaymentWithdrawAmount = values[3];
        reportData.totalUserPlaceBet = values[4];
        reportData.totalUserDeposit = values[5] * 1 + statistical.totalUserDeposit * 1;
        reportData.totalUserDepositInDay = values[6];
        reportData.totalNewUserDepositInDay = values[7];
        reportData.totalUserWithdraw = values[8] * 1 + statistical.totalUserWithdraw * 1;
        reportData.totalUserWithdrawInDay = values[9];
        reportData.totalNewUserWithdrawInDay = values[10];
        reportData.totalUserMission = values[11] * 1 + statistical.totalUserMission * 1;
        reportData.totalUserMissionInDay = values[12];
        reportData.totalNewUserMissionInDay = values[13];
        reportData.totalMisionBonus = values[14] * 1 + statistical.totalMisionBonus * 1;
        reportData.totalUsersByDate = values[15] * 1 + statistical.totalUsersByDate * 1;
        reportData.totalUserPlayWinAmount = values[16];
        reportData.totalUserPlayLoseAmount = values[17];
        reportData.totalUserPlayProfitAmount = Math.abs(reportData.totalUserPlayWinAmount) - Math.abs(reportData.totalUserPlayLoseAmount);
        reportData.totalUserPaymentDepositAmountUSDT = values[18];
        reportData.totalUserPaymentWithdrawAmountUSDT = values[19];
        reportData.totalUserPaymentDepositAmountVND = values[20];
        reportData.totalUserPaymentWithdrawAmountVND = values[21];
        resolve(reportData);
      });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getUserDetailReport(req) {
  let endDate = req.payload.endDate;
  let startDate = req.payload.startDate;
  const appUserId = req.payload.filter.appUserId;

  return new Promise(async (resolve, reject) => {
    let reportData = {
      totalUserPaymentDepositAmount: 0, //<< tong so tien nap cua user
      totalUserPaymentWithdrawAmount: 0, //<< tong so tien rut cua user
      totalUserSumaryWin: 0,
      totalUserPointAmount: 0,
    };
    try {
      let promiseList = [];

      let promisetotalUserPaymentDepositAmount = StatisticalFunctions.sumTotalUserPaymentDeposit(
        { appUserId: appUserId, paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED },
        startDate,
        endDate,
      );
      promiseList.push(promisetotalUserPaymentDepositAmount);

      let promisetotalUserPaymentWithdrawAmount = StatisticalFunctions.sumTotalUserPaymentWithdraw(
        { appUserId: appUserId, paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED },
        startDate,
        endDate,
      );

      promiseList.push(promisetotalUserPaymentWithdrawAmount);

      let promisesumTotalUserSumaryWin = StatisticalFunctions.sumaryWinLoseAmount({ appUserId: appUserId }, startDate, endDate);
      promiseList.push(promisesumTotalUserSumaryWin);

      let promisesumSumaryPointAmount = StatisticalFunctions.sumaryPointAmount({ appUserId: appUserId }, startDate, endDate);
      promiseList.push(promisesumSumaryPointAmount);

      Promise.all(promiseList).then(values => {
        reportData.totalUserPaymentDepositAmount = values[0];
        reportData.totalUserPaymentWithdrawAmount = values[1];
        reportData.totalUserSumaryWin = values[2] || 0;
        reportData.totalUserPointAmount = values[3] || 0;
        resolve(reportData);
      });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function summaryUserPayment(req) {
  let endDate = req.payload.endDate;
  let startDate = req.payload.startDate;
  let appUserId = req.payload.appUserId;

  return new Promise(async (resolve, reject) => {
    try {
      let summaryUserPaymentResult = StatisticalFunctions.summaryUserPayment(appUserId, startDate, endDate);
      if (summaryUserPaymentResult) {
        resolve(summaryUserPaymentResult);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

function _checkCount(countResult) {
  if (countResult && countResult.length > 0) {
    /**
     * example
     * res: [{ count:  0 }]
     * @return res[0].count
     */
    return countResult[0][Object.keys(countResult[0])[0]];
  }
  return 0;
}

async function _countAllUser(startDate, endDate) {
  let countAllUser = await AppUsersResourceAccess.customCount({
    startDate: startDate,
    endDate: endDate,
  });
  return _checkCount(countAllUser);
}

async function _countAllUserKYC(startDate, endDate) {
  let countAllUserKYC = await AppUsersResourceAccess.customCount({
    isVerified: USER_VERIFY_INFO_STATUS.IS_VERIFIED,
    startDate: startDate,
    endDate: endDate,
  });
  return _checkCount(countAllUserKYC);
}

async function _sumWithdrawUSDT(startDate, endDate) {
  let sumWithDrawUSDT = await WithdrawTransactionUserView.customSum(
    'paymentAmount',
    {
      walletType: WALLET_TYPE.USDT,
    },
    startDate,
    endDate,
  );
  return _checkCount(sumWithDrawUSDT);
}

async function _sumWithdrawBTC(startDate, endDate) {
  let sumWithDrawUSDT = await WithdrawTransactionUserView.customSum(
    'paymentAmount',
    {
      walletType: WALLET_TYPE.BTC,
    },
    startDate,
    endDate,
  );
  return _checkCount(sumWithDrawUSDT);
}

async function summaryUserReport(req) {
  return new Promise(async (resolve, reject) => {
    let reportData = {
      totalNewUsersByDate: 0, //<< tong so luong new user theo ngày
      totalNewUsersByWeek: 0, //<< tong so luong new user theo tuần
      totalNewUsersByMonth: 0, //<< tong so luong new user theo tháng
      totalNewUsersByYear: 0, //<< tong so luong new user theo năm
      totalUsers: 0, //<< tong so lượng user
      countAllUserKYC: 0, //<< tong so lượng user KYC
      totalUserPaymentService: 0, //<< tong so lượng user đã mua
      countUserMember: 0, //<< tong so lượng tổ chức
    };
    try {
      let promiseList = [];
      const startDate = moment(new Date()).startOf('day').format();
      const endDate = moment(new Date()).endOf('day').format();
      let promiseTotalNewUsersByDate = StatisticalFunctions.countTotalNewUsers(startDate, endDate);
      promiseList.push(promiseTotalNewUsersByDate);

      // new User trong tuần (tinh tu thu 2 den CN)
      const startDateOfWeek = moment(new Date()).startOf('isoWeek').add(-1, 'week').endOf('day').format();
      const endDateOfWeek = moment(new Date()).startOf('isoWeek').endOf('day').format();
      let promiseTotalNewUsersByWeek = StatisticalFunctions.countTotalNewUsers(startDateOfWeek, endDateOfWeek);
      promiseList.push(promiseTotalNewUsersByWeek);
      // new User trong tháng
      const startOfMonth = moment(new Date()).startOf('month').format();
      const endOfMonth = moment(new Date()).endOf('month').format();
      let promiseTotalNewUsersByMonth = StatisticalFunctions.countTotalNewUsers(startOfMonth, endOfMonth);
      promiseList.push(promiseTotalNewUsersByMonth);
      // new User trong năm
      const startOfYear = moment(new Date()).startOf('year').format();
      const endOfYear = moment(new Date()).endOf('year').format();
      let promiseTotalNewUsersByYear = StatisticalFunctions.countTotalNewUsers(startOfYear, endOfYear);
      promiseList.push(promiseTotalNewUsersByYear);
      // tổng số lượng user
      let promiseTotalUsers = StatisticalFunctions.countTotalUser();
      promiseList.push(promiseTotalUsers);
      // tổng số lượng User KYC
      let promiseCountAllUserKYC = await _countAllUserKYC();
      promiseList.push(promiseCountAllUserKYC);
      // số lượng user đã mua máy
      let promiseTotalUserPaymentService = StatisticalFunctions.countTotalMiningUser(undefined, undefined, 'appUserId');
      promiseList.push(promiseTotalUserPaymentService);
      // số lượng tổ chức
      let promiseCountUserMember = StatisticalFunctions.CountMemberShip();
      promiseList.push(promiseCountUserMember);
      Promise.all(promiseList).then(values => {
        reportData.totalNewUsersByDate = values[0];
        reportData.totalNewUsersByWeek = values[1];
        reportData.totalNewUsersByMonth = values[2];
        reportData.totalNewUsersByYear = values[3];
        reportData.totalUsers = values[4];
        reportData.countAllUserKYC = values[5];
        reportData.totalUserPaymentService = values[6];
        reportData.countUserMember = values[7];

        resolve(reportData);
      });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getPaymentStatisticCount(req) {
  return new Promise(async (resolve, reject) => {
    let reportData = {
      totalDepositRequest: 0, //<< tong so luong yeu cau nap tien NEW
      totalWithdrawRequest: 0, //<< tong so luong yeu cau rut tien NEW
      totalPaymentBonusRequest: 0, //<< tong so luong yeu cau tra tien hoa hong NEW
    };
    try {
      let promiseList = [];

      let promisetotalDepositRequest = StatisticalFunctions.countTotalPaymentDeposit({
        paymentStatus: DEPOSIT_TRX_STATUS.NEW,
      });
      promiseList.push(promisetotalDepositRequest);

      let promisetotalWithdrawRequest = StatisticalFunctions.countTotalWithdrawDeposit({
        paymentStatus: WITHDRAW_TRX_STATUS.NEW,
      });
      promiseList.push(promisetotalWithdrawRequest);

      let promisetotalPaymentBonusRequest = StatisticalFunctions.countTotalPaymentBonus({
        paymentStatus: WITHDRAW_TRX_STATUS.NEW,
      });
      promiseList.push(promisetotalPaymentBonusRequest);

      Promise.all(promiseList).then(values => {
        reportData.totalDepositRequest = values[0] || 0;
        reportData.totalWithdrawRequest = values[1] || 0;
        reportData.totalPaymentBonusRequest = values[2] || 0;
        resolve(reportData);
      });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  generalReport,
  summaryUserPayment,
  summaryUserReport,
  getUserDetailReport,
  getPaymentStatisticCount,
};
