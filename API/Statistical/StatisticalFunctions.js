/* Copyright (c) 2022-2023 Reminano */

const Logger = require('../../utils/logging');
const moment = require('moment');
const { DEPOSIT_TRX_STATUS, DEPOSIT_TRX_CATEGORY, DEPOSIT_TRX_UNIT } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const { WITHDRAW_TRX_STATUS } = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
const { PAYMENT_TYPE } = require('../PaymentMethod/PaymentMethodConstant');
const { BET_RESULT } = require('../GamePlayRecords/GamePlayRecordsConstant');
const StatisticalResource = require('./resourceAccess/StatisticalResourceAccess');
async function syncStatistical(startDate, endDate) {
  let yesterday = moment().add(-1, 'day').format('YYYY/MM/DD');
  let updateData = {
    totalUsers: 0, //<< tong so luong user //
    totalUsersByDate: 0, //<< tong so luong user theo ngay//
    totalUserDeposit: 0, // tong so tai khoan nap tien - mỗi tk tính nạp 1 lần //
    totalUserWithdraw: 0, // tong so tai khoan rut tien - mỗi tk tính rut 1 lần //
    totalUserMission: 0, // tổng số tài khoản làm nhiệm vụ - mỗi tk tính làm nv 1 lần //
    totalMisionBonus: 0, // tổng chi bonus nhiệm vụ//
    date: yesterday,
  };
  let promiseList = [];
  let _currentStaffId = undefined;
  const filter = {};
  filter.staffId = _currentStaffId;

  //tổng tài khoản đăng ký theo ngày [0]
  let promisetotalUsers = countTotalStaffUser(_currentStaffId, undefined, endDate);
  promiseList.push(promisetotalUsers);

  //tổng tài khoản đã nạp tiền
  //2. "Tổng tài khoản nạp tiền" lưu ý: mỗi tk chỉ được tính 1 lần duy nhất, đó là lần nạp đầu tiên [5]
  let promisetotalUserDeposit = countTotalUserDeposit(_currentStaffId, undefined, endDate);
  promiseList.push(promisetotalUserDeposit);

  //"Tổng tài khoản rút tiền" lưu ý: cũng 1 tk được tính 1 lần duy nhất,
  //cả khi họ chưa nạp tiền, nhưng họ có tiền hoa hồng từ NV,
  //mà họ rút thì tk đó cũng được tính và chỉ 1 lần duy nhất [8]
  let promisetotalUserWithdraw = countTotalUserWithdraw(_currentStaffId, undefined, endDate);
  promiseList.push(promisetotalUserWithdraw);

  //tổng tài khoản làm nhiệm vụ
  //4. "Tổng tài khoản làm nhiệm vụ" mỗi tk mà hoàn thành 1 nhiệm vụ đầu tiên là được tính là 1
  //và mỗi tk chỉ được tính vào đây duy nhất 1 lần [11]
  let promisetotalUserMissionCompleted = countTotalUserMissionCompletedByDate(_currentStaffId, undefined, endDate);
  promiseList.push(promisetotalUserMissionCompleted);

  // tổng chi bonus nhiệm vụ [14]
  let promiseSumTotalAmountMissionCompleted = sumTotalAmountMissionCompleted(_currentStaffId, undefined, endDate);
  promiseList.push(promiseSumTotalAmountMissionCompleted);

  //tổng tài khoản đăng ký
  ////1. "Tổng tài khoản đăng ký" thì sẽ biết từ trước đến hiện tjai được bao nhiêu tk đk rồi [15]
  let promisetotalUsersByDate = countTotalUser(_currentStaffId, undefined, endDate);
  promiseList.push(promisetotalUsersByDate);

  Promise.all(promiseList).then(async values => {
    updateData.totalUsers = values[0];
    updateData.totalUserDeposit = values[1];
    updateData.totalUserWithdraw = values[2];
    updateData.totalUserMission = values[3];
    updateData.totalMisionBonus = values[4];
    updateData.totalUsersByDate = values[5];
    // return(updateData);
    let insertResult = await StatisticalResource.insert(updateData);
    if (insertResult && insertResult.length > 0) {
      Logger.info(`insertStatistical done`);
    } else {
      Logger.error(`insertStatistical failed`);
    }
  });
}

async function countTotalUser(staffId, startDate, endDate) {
  const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
  let _filter = {};
  if (staffId) {
    _filter.staffId = staffId;
    let countAll = await AppUserResource.customCount(_filter, undefined, undefined);
    if (countAll) {
      return countAll[0].count;
    }

    return 0;
  } else {
    let countAll = await AppUserResource.customCount(_filter, undefined, undefined, startDate, endDate);
    if (countAll) {
      return countAll[0].count;
    }

    return 0;
  }
}

async function sumTotalUserPaymentDeposit(staffId, startDate, endDate) {
  const DepositTransactionUserView = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  let filter = {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
  };
  if (staffId) {
    filter.staffId = staffId;
  }
  let sumAll = await DepositTransactionUserView.customSum('paymentAmount', filter, undefined, undefined, startDate, endDate);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}
async function sumTotalUserPaymentDepositUSDT(staffId, startDate, endDate) {
  const DepositTransactionUserView = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  let filter = {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
  };
  if (staffId) {
    filter.staffId = staffId;
  }
  filter.paymentUnit = DEPOSIT_TRX_UNIT.USDT;
  let sumAll = await DepositTransactionUserView.customSum('paymentRefAmount', filter, undefined, undefined, startDate, endDate);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}
async function sumTotalUserPaymentDepositVND(staffId, startDate, endDate) {
  const DepositTransactionUserView = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  let filter = {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
  };
  if (staffId) {
    filter.staffId = staffId;
  }
  filter.paymentUnit = DEPOSIT_TRX_UNIT.VND;
  let sumAll = await DepositTransactionUserView.customSum('paymentRefAmount', filter, undefined, undefined, startDate, endDate);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}
async function sumTotalUserPaymentWithdraw(staffId, startDate, endDate) {
  const WithdrawTransactionUserView = require('../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  let filter = {
    paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
  };
  if (staffId) {
    filter.staffId = staffId;
  }
  let sumAll = await WithdrawTransactionUserView.customSum('paymentRefAmount', filter, startDate, endDate);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}
async function sumTotalUserPaymentWithdrawUSDT(staffId, startDate, endDate) {
  const WithdrawTransactionUserView = require('../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  let filter = {
    paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
  };
  if (staffId) {
    filter.staffId = staffId;
  }
  filter.paymentCategory = DEPOSIT_TRX_CATEGORY.USDT;
  let sumAll = await WithdrawTransactionUserView.customSum('paymentRefAmount', filter, startDate, endDate);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}
async function sumTotalUserPaymentWithdrawVND(staffId, startDate, endDate) {
  const WithdrawTransactionUserView = require('../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  let filter = {
    paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
  };
  if (staffId) {
    filter.staffId = staffId;
  }
  filter.paymentCategory = DEPOSIT_TRX_CATEGORY.BANK;
  let sumAll = await WithdrawTransactionUserView.customSum('paymentRefAmount', filter, startDate, endDate);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}
async function sumTotalUserPlaceBet(sumField, filter = {}, startDate, endDate) {
  const GamePlayRecordsView = require('../GamePlayRecords/resourceAccess/GamePlayRecordsView');
  let sumAll = await GamePlayRecordsView.customSum(sumField, filter, undefined, startDate, endDate);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}

async function countTotalStaffUser(staffId, startDate, endDate) {
  let _filter = {};
  const AppUserView = require('../AppUsers/resourceAccess/AppUserView');
  if (staffId) {
    _filter.staffId = staffId;
    let countAll = await AppUserView.customCount(_filter);
    if (countAll) {
      return countAll[0].count;
    }
    return 0;
  } else {
    let countAll = await AppUserView.customCount(_filter, startDate, endDate);
    if (countAll) {
      return countAll[0].count;
    }
    return 0;
  }
}

async function countTotalNewUsers(staffId, startDate, endDate) {
  let _filter = {};
  if (staffId) {
    _filter.staffId = staffId;
  }
  const AppUserView = require('../AppUsers/resourceAccess/AppUserView');
  let countAll = await AppUserView.customCount(_filter, startDate, endDate);
  if (countAll) {
    return countAll[0].count;
  }

  return 0;
}

async function countTotalUserDepositByDate(staffId, startDate, endDate) {
  //tổng tk nạp tiền theo ngày
  const PaymentDepositTransactionUserView = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
  let _filter = {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
  };
  //tổng tk nạp tiền
  if (staffId) {
    _filter.staffId = staffId;
  }
  const depositCount = await PaymentDepositTransactionUserView.countDistinct(_filter, 'appUserId', startDate, endDate, 1);
  if (depositCount && depositCount.length > 0) {
    return depositCount[0].count;
  }
  return 0;
}

async function countTotalUserDeposit(staffId, startDate, endDate) {
  //tổng tk nạp tiền theo ngày
  const PaymentDepositTransactionUserView = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
  let _filter = {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
  };
  //tổng tk nạp tiền
  if (staffId) {
    _filter.staffId = staffId;
    const depositCount = await PaymentDepositTransactionUserView.countDistinct(_filter, 'appUserId');
    if (depositCount && depositCount.length > 0) {
      return depositCount[0].count;
    }
    return 0;
  } else {
    const depositCount = await PaymentDepositTransactionUserView.countDistinct(_filter, 'appUserId', startDate, endDate);
    if (depositCount && depositCount.length > 0) {
      return depositCount[0].count;
    }
    return 0;
  }
}

async function countTotalNewUserDeposit(staffId, startDate, endDate) {
  //tổng tk mới nạp tiền lần đầu
  const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
  let _filter = {};

  //tổng tk nạp tiền
  if (staffId) {
    _filter.staffId = staffId;
  }
  const _customCountFirstDepositAt = await AppUsersResourceAccess.customCountFirstDepositAt(_filter, startDate, endDate);
  if (_customCountFirstDepositAt && _customCountFirstDepositAt.length > 0) {
    return _customCountFirstDepositAt[0].count;
  }
  return 0;
}

async function countTotalUserWithdrawByDate(staffId, startDate, endDate) {
  //tổng tk rút tiền theo ngày
  const WithdrawTransactionUserView = require('../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  const { WITHDRAW_TRX_STATUS } = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
  let _filter = {
    paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
  };
  //tổng tk nạp tiền
  if (staffId) {
    _filter.staffId = staffId;
  }
  const withdrawCount = await WithdrawTransactionUserView.countDistinct(_filter, 'appUserId', startDate, endDate, 1);
  if (withdrawCount && withdrawCount.length > 0) {
    return withdrawCount[0].count;
  }
  return 0;
}

async function countTotalUserWithdraw(staffId, startDate, endDate) {
  //tổng tk rút tiền theo ngày
  const WithdrawTransactionUserView = require('../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  const { WITHDRAW_TRX_STATUS } = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
  let _filter = {
    paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
  };
  //tổng tk nạp tiền
  if (staffId) {
    _filter.staffId = staffId;
    const withdrawCount = await WithdrawTransactionUserView.countDistinct(_filter, 'appUserId');
    if (withdrawCount && withdrawCount.length > 0) {
      return withdrawCount[0].count;
    }
    return 0;
  } else {
    const withdrawCount = await WithdrawTransactionUserView.countDistinct(_filter, 'appUserId', startDate, endDate);
    if (withdrawCount && withdrawCount.length > 0) {
      return withdrawCount[0].count;
    }
    return 0;
  }
}

async function countTotalNewUserWithdraw(staffId, startDate, endDate) {
  //tổng tk mới rút tiền lần đầu
  const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
  let _filter = {};

  //tổng tk nạp tiền
  if (staffId) {
    _filter.staffId = staffId;
  }
  const _customCountFirstWithdrawAt = await AppUsersResourceAccess.customCountFirstWithdrawAt(_filter, startDate, endDate);
  if (_customCountFirstWithdrawAt && _customCountFirstWithdrawAt.length > 0) {
    return _customCountFirstWithdrawAt[0].count;
  }
  return 0;
}

async function countTotalUserMissionCompletedByDate(staffId, startDate, endDate) {
  //tổng tk nạp tiền theo ngày
  const AppUserMissionHistoryView = require('../AppUserMission/resourceAccess/AppUserMissionHistoryView');
  const { MISSION_STATUS } = require('../AppUserMission/AppUserMissionConstant');
  let _filter = {
    missionStatus: [MISSION_STATUS.COMPLETED, MISSION_STATUS.FAILED, MISSION_STATUS.FAILED_HALF_1, MISSION_STATUS.FAILED_HALF_2],
  };
  //tổng tk nạp tiền
  if (staffId) {
    _filter.staffId = staffId;
    const _UserMissionCompletedCount = await AppUserMissionHistoryView.countDistinct(_filter, 'appUserId');
    if (_UserMissionCompletedCount && _UserMissionCompletedCount.length > 0) {
      return _UserMissionCompletedCount[0].count;
    }
    return 0;
  } else {
    const _UserMissionCompletedCount = await AppUserMissionHistoryView.countDistinct(_filter, 'appUserId', startDate, endDate);
    if (_UserMissionCompletedCount && _UserMissionCompletedCount.length > 0) {
      return _UserMissionCompletedCount[0].count;
    }
    return 0;
  }
}

async function countTotalUserMissionCompleted(staffId, startDate, endDate) {
  //tổng tk hoan thanh nhiem vu theo ngày
  const AppUserMissionHistoryView = require('../AppUserMission/resourceAccess/AppUserMissionHistoryView');
  const { MISSION_STATUS } = require('../AppUserMission/AppUserMissionConstant');
  let _filter = {
    missionStatus: [MISSION_STATUS.COMPLETED, MISSION_STATUS.WIN_HALF_1, MISSION_STATUS.WIN_HALF_2],
  };

  if (staffId) {
    _filter.staffId = staffId;
  }
  const _UserMissionCompletedCount = await AppUserMissionHistoryView.countDistinct(_filter, 'appUserId', startDate, endDate);
  if (_UserMissionCompletedCount && _UserMissionCompletedCount.length > 0) {
    return _UserMissionCompletedCount[0].count;
  }
  return 0;
}

async function countTotalNewUserMissionCompleted(staffId, startDate, endDate) {
  let _filter = {};
  if (staffId) {
    _filter.staffId = staffId;
  }
  const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
  const _customCountFirstMissionAt = await AppUserResource.customCountFirstMissionAt(_filter, startDate, endDate);
  if (_customCountFirstMissionAt && _customCountFirstMissionAt.length > 0) {
    return _customCountFirstMissionAt[0].count;
  }
  return 0;
}

async function sumTotalAmountMissionCompleted(staffId, startDate, endDate) {
  //tổng tiền bonus làm nhiệm vụ
  const WalletRecordView = require('../WalletRecord/resourceAccess/WalletRecordView');
  const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
  let _filter = {
    WalletRecordType: [WALLET_RECORD_TYPE.MISSON_COMPLETED, WALLET_RECORD_TYPE.MISSON_REFERRAL_COMPLETED],
  };
  if (staffId) {
    _filter.staffId = staffId;
    const sumTotalAmountMissionCompleted = await WalletRecordView.customSum('paymentAmount', _filter);
    if (sumTotalAmountMissionCompleted && sumTotalAmountMissionCompleted.length > 0) {
      return sumTotalAmountMissionCompleted[0].sumResult;
    }
    return 0;
  } else {
    const sumTotalAmountMissionCompleted = await WalletRecordView.customSum('paymentAmount', _filter, startDate, endDate);
    if (sumTotalAmountMissionCompleted && sumTotalAmountMissionCompleted.length > 0) {
      return sumTotalAmountMissionCompleted[0].sumResult;
    }
    return 0;
  }
}

async function CountMemberShip(startDate, endDate) {
  const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
  let countAll = await AppUserResource.customCountMemberShip({}, undefined, startDate, endDate);
  if (countAll) {
    return countAll[0].count;
  }

  return 0;
}

async function countTotalAgency() {
  const StaffResource = require('../Staff/resourceAccess/StaffResourceAccess');
  const AGENCY_ROLE = 5;
  let countAll = await StaffResource.count({
    roleId: AGENCY_ROLE,
  });
  if (countAll) {
    return countAll[0].count;
  }

  return 0;
}

function _extractCreatedDate(createdDateList, newListData) {
  if (newListData) {
    for (let i = 0; i < newListData.length; i++) {
      const _newDate = newListData[i];
      if (createdDateList.indexOf(_newDate.createdDate) < 0) {
        createdDateList.push(_newDate.createdDate);
      }
    }
  }
  return createdDateList;
}

function _extractSummaryResult(createdDate, summaryResultList) {
  if (summaryResultList) {
    for (let i = 0; i < summaryResultList.length; i++) {
      const _result = summaryResultList[i];
      if (createdDate === _result.createdDate) {
        return _result.totalSum;
      }
    }
  }

  return 0;
}

async function summaryUserPayment(appUserId, startDate, endDate) {
  const DepositTransactionUserView = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  let summaryDeposit = await DepositTransactionUserView.sumAmountDistinctByDate({ appUserId: appUserId }, startDate, endDate);

  const WithdrawTransactionUserView = require('../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  let summaryWithdraw = await WithdrawTransactionUserView.sumAmountDistinctByDate({ appUserId: appUserId }, startDate, endDate);

  let createdDateList = [];
  createdDateList = _extractCreatedDate(createdDateList, summaryDeposit);
  createdDateList = _extractCreatedDate(createdDateList, summaryWithdraw);
  createdDateList = createdDateList.sort();

  let summaryResultList = [];
  for (let i = 0; i < createdDateList.length; i++) {
    const _createdDate = createdDateList[i];
    let _newSummaryResult = {
      createdDate: _createdDate,
      totalDeposit: _extractSummaryResult(_createdDate, summaryDeposit),
      totalWithdraw: _extractSummaryResult(_createdDate, summaryWithdraw),
      totalSell: 999,
      totalBuy: 111,
    };
    summaryResultList.push(_newSummaryResult);
  }

  return summaryResultList;
}

async function summaryReferUserBonus(appUserId) {
  const WalletRecordView = require('../WalletRecord/resourceAccess/WalletRecordView');
  const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');

  let summaryResult = {
    bonusYesterdayTotal: 0, //hoa hồng ngày hôm  qua
    bonusYesterdayF1: 0, //hoa hồng cấp dưới trực tiếp
    bonusYesterdaySystem: 0, //hoa hồng đội
    bonusThisWeekTotal: 0, //tổng hoa hồng tuần này
    bonusTotal: 0, //tổng hoa hồng
    totalSystemBuy: 0, //Tổng doanh thu
  };

  const now = moment();
  const startToDay = now.startOf('day').format();
  const endToDay = now.endOf('day').format();
  const startToYesterday = now.startOf('day').subtract(1, 'days').format();
  const startWeek = now.startOf('isoWeek').format();

  const promises = [];
  let promiseBonusYesterdayTotal = WalletRecordView.sumReferedUserByUserId(
    {
      WalletRecordType: WALLET_RECORD_TYPE.REFER_BONUS,
    },
    appUserId,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    startToYesterday,
    startToDay,
  );
  promises.push(promiseBonusYesterdayTotal);

  let promiseBonusYesterdayF1 = WalletRecordView.sumReferedUserByUserId(
    {
      WalletRecordType: WALLET_RECORD_TYPE.REFER_BONUS,
    },
    undefined,
    appUserId,
  );
  promises.push(promiseBonusYesterdayF1);

  let promiseBonusYesterdaySystem = WalletRecordView.sumReferedUserByUserId(
    {
      WalletRecordType: WALLET_RECORD_TYPE.REFER_BONUS,
    },
    appUserId,
  );
  promises.push(promiseBonusYesterdaySystem);

  let promiseBonusThisWeekTotal = WalletRecordView.sumReferedUserByUserId(
    {
      WalletRecordType: WALLET_RECORD_TYPE.REFER_BONUS,
    },
    appUserId,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    startWeek,
    endToDay,
  );
  promises.push(promiseBonusThisWeekTotal);

  let promiseBonusTotal = WalletRecordView.sumReferedUserByUserId(
    {
      WalletRecordType: WALLET_RECORD_TYPE.REFER_BONUS,
    },
    appUserId,
  );
  promises.push(promiseBonusTotal);

  const result = await Promise.all(promises);

  summaryResult.bonusYesterdayTotal = (result[0] && result[0][0] && result[0][0].sumResult) || 0;
  summaryResult.bonusYesterdayF1 = (result[1] && result[1][0] && result[1][0].sumResult) || 0;
  summaryResult.bonusYesterdaySystem = (result[2] && result[2][0] && result[2][0].sumResult) || 0;
  summaryResult.bonusThisWeekTotal = (result[3] && result[3][0] && result[3][0].sumResult) || 0;
  summaryResult.bonusTotal = (result[4] && result[4][0] && result[4][0].sumResult) || 0;

  return summaryResult;
}

async function summaryReferUserTotal(appUserId) {
  const summaryResult = {
    totalF1: 0, //cấp dưới trực tiếp (Số lượng)
    totalSystem: 0, //Tổng thành viên (Số lượng)
    totalNewF1: 0, //F1 mới hôm nay
    totalNewF: 0, //F mới hôm nay
  };
  const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
  const AppUserView = require('../AppUsers/resourceAccess/AppUserView');
  const now = moment();
  const startToDay = now.startOf('day').format();
  const endToDay = now.endOf('day').format();

  const promises = [];
  let totalF1 = AppUserView.customCount({
    memberReferIdF1: appUserId,
  });
  promises.push(totalF1);

  let totalSystem = AppUsersResourceAccess.countReferedUserByUserId({ appUserId: appUserId });
  promises.push(totalSystem);

  let totalNewF1 = AppUserView.customCount(
    {
      memberReferIdF1: appUserId,
    },
    undefined,
    undefined,
    startToDay,
    endToDay,
  );
  promises.push(totalNewF1);

  let totalNewF = AppUsersResourceAccess.countReferedUserByUserId({ appUserId: appUserId }, startToDay, endToDay);
  promises.push(totalNewF);

  const result = await Promise.all(promises);

  summaryResult.totalF1 = (result[0] && result[0][0] && result[0][0].count) || 0;
  summaryResult.totalSystem = (result[1] && result[1][0] && result[1][0].count) || 0;
  summaryResult.totalNewF1 = (result[2] && result[2][0] && result[2][0].count) || 0;
  summaryResult.totalNewF = (result[3] && result[3][0] && result[3][0].count) || 0;

  return summaryResult;
}

async function summaryReferUser(appUserId, skip = 0, limit = 5) {
  const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

  const SummaryServicePackageUserViews = require('../PaymentServicePackage/resourceAccess/SummaryPaymentServicePackageUserView');
  const SummaryDepositUserViews = require('../PaymentDepositTransaction/resourceAccess/SummaryUserPaymentDepositTransactionView');
  const SummaryWithdrawUserViews = require('../PaymentWithdrawTransaction/resourceAccess/SummaryUserWithdrawTransactionView');
  const SummaryExchangeUserViews = require('../PaymentExchangeTransaction/resourceAccess/SummaryUserExchangeTransactionView');
  const DEPOSIT_TRX_STATUS = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant').DEPOSIT_TRX_STATUS;
  const WITHDRAW_TRX_STATUS = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant').WITHDRAW_TRX_STATUS;
  const EXCHANGE_TRX_STATUS = require('../PaymentExchangeTransaction/PaymentExchangeTransactionConstant').EXCHANGE_TRX_STATUS;

  let summaryResult = {
    summaryData: [],
    summaryCountTotal: 0,
    summaryTotalDeposit: 0,
    summaryTotalWithdraw: 0,
    summaryTotalBuy: 0,
    summaryTotalSell: 0,
  };
  let totalCountReferUser = await AppUserResource.count({
    referUserId: appUserId,
  });

  if (!totalCountReferUser || totalCountReferUser.length <= 0) {
    Logger.info(`There is no data to summary refer user for appUserId ${appUserId}`);
    //No data to summary
    return summaryResult;
  }

  const _order = {
    key: 'appUserId',
    value: 'desc',
  };
  let _userList = await AppUserResource.find(
    {
      referUserId: appUserId,
    },
    skip,
    limit,
    _order,
  );

  if (!_userList) {
    Logger.info(`There is no data to summary refer user for appUserId ${appUserId}`);
    //No data to summary
    return summaryResult;
  }
  let userSummaryRecords = [];
  for (let i = 0; i < _userList.length; i++) {
    const _userData = _userList[i];
    let summaryDeposit = await SummaryDepositUserViews.find(
      {
        appUserId: _userData.appUserId,
        paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
      },
      0,
      1,
      _order,
    );

    let summaryWithdraw = await SummaryWithdrawUserViews.find(
      {
        appUserId: _userData.appUserId,
        paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
      },
      0,
      1,
      _order,
    );

    let summaryBuy = await SummaryServicePackageUserViews.find(
      {
        appUserId: _userData.appUserId,
      },
      0,
      1,
      _order,
    );

    let summarySell = await SummaryExchangeUserViews.find(
      {
        appUserId: _userData.appUserId,
        paymentStatus: EXCHANGE_TRX_STATUS.COMPLETED,
      },
      0,
      1,
      _order,
    );

    let _summaryRecord = {
      totalWithdraw: 0,
      totalDeposit: 0,
      totalBuy: 0,
      totalSell: 0,
      username: _userData.username,
      appUserId: _userData.appUserId,
    };

    if (summaryDeposit && summaryDeposit.length > 0) {
      _summaryRecord.totalDeposit = summaryDeposit[0].totalSum;
    }

    if (summaryWithdraw && summaryWithdraw.length > 0) {
      _summaryRecord.totalWithdraw = summaryWithdraw[0].totalSum;
    }

    if (summaryBuy && summaryBuy.length > 0) {
      _summaryRecord.totalBuy = summaryBuy[0].totalSum;
    }

    if (summarySell && summarySell.length > 0) {
      _summaryRecord.totalSell = summarySell[0].totalSum;
    }

    userSummaryRecords.push(_summaryRecord);
  }

  //summaryTotalDeposit
  let _summaryTotalDeposit = await SummaryDepositUserViews.sum('totalSum', {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
    referUserId: appUserId,
  });

  if (_summaryTotalDeposit && _summaryTotalDeposit.length > 0) {
    summaryResult.summaryTotalDeposit = _summaryTotalDeposit[0].sumResult;
  }

  //_summaryTotalWithdraw
  let _summaryTotalWithdraw = await SummaryWithdrawUserViews.sum('totalSum', {
    paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
    referUserId: appUserId,
  });

  if (_summaryTotalWithdraw && _summaryTotalWithdraw.length > 0) {
    summaryResult.summaryTotalWithdraw = _summaryTotalWithdraw[0].sumResult;
  }

  //summaryTotalBuy
  let _summaryTotalBuy = await SummaryServicePackageUserViews.sum('totalpackagePaymentAmount', {
    appUserId,
  });

  if (_summaryTotalBuy && _summaryTotalBuy.length > 0) {
    summaryResult.summaryTotalBuy = _summaryTotalBuy[0].sumResult;
  }

  //_summaryTotalSell
  let _summaryTotalSell = await SummaryExchangeUserViews.sum('totalSum', {
    paymentStatus: EXCHANGE_TRX_STATUS.COMPLETED,
    referUserId: appUserId,
  });

  if (_summaryTotalSell && _summaryTotalSell.length > 0) {
    summaryResult.summaryTotalSell = _summaryTotalSell[0].sumResult;
  }

  summaryResult.summaryData = userSummaryRecords;
  summaryResult.summaryCountTotal = totalCountReferUser[0].count;

  const [totalBonus, totalMember] = await Promise.all([summaryReferUserBonus(appUserId), summaryReferUserTotal(appUserId)]);

  return { ...summaryResult, totalBonus, totalMember };
}

async function countTotalMiningUser(startDate, endDate, distinctFields) {
  const UserServicePackage = require('../PaymentServicePackage/resourceAccess/PaymentServicePackageUserResourceAccess');
  let countResult = await UserServicePackage.customCountDistinct({}, distinctFields, startDate, endDate);
  if (countResult) {
    return countResult[0].CountResult;
  }
  return 0;
}

async function sumTotal(firstFields, secondFields, startDate, endDate) {
  const UserServicePackage = require('../PaymentServicePackage/resourceAccess/PaymentServicePackageUserResourceAccess');
  let sumFirstFields = await UserServicePackage.customSum({}, firstFields, undefined, undefined, startDate, endDate);
  let sumSecondFields = await UserServicePackage.customSum({}, secondFields, undefined, undefined, startDate, endDate);
  let sumAll = 0;
  let sumFirstFieldsResult;
  let sumSecondFieldsResult;
  if (sumFirstFields && sumFirstFields.length > 0) {
    sumFirstFieldsResult = sumFirstFields[0].sumResult;
  } else {
    sumFirstFieldsResult = 0;
  }
  if (sumSecondFields && sumSecondFields.length > 0) {
    sumSecondFieldsResult = sumSecondFields[0].sumResult;
  } else {
    sumSecondFieldsResult = 0;
  }
  return (sumAll = sumFirstFieldsResult + sumSecondFieldsResult);
}

async function sumaryWinLoseAmount(filter = {}, startDate, endDate) {
  const BetRecordsResourceAccess = require('../BetRecords/resourceAccess/BetRecordsResourceAccess');
  let sumAll = await BetRecordsResourceAccess.sumaryWinLoseAmount(startDate, endDate, filter);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}

async function sumaryPointAmount(filter = {}, startDate, endDate) {
  const BetRecordsResourceAccess = require('../BetRecords/resourceAccess/BetRecordsResourceAccess');
  let sumAll = await BetRecordsResourceAccess.sumaryPointAmount(startDate, endDate, filter);
  if (sumAll) {
    return sumAll[0].sumResult;
  }

  return 0;
}

async function countTotalPaymentDeposit(filter, startDate, endDate) {
  const PaymentDepositTransactionUserView = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  let countResult = await PaymentDepositTransactionUserView.customCount(filter, undefined, undefined, startDate, endDate);
  if (countResult) {
    return countResult[0].count;
  }
  return 0;
}

async function countTotalWithdrawDeposit(filter, startDate, endDate) {
  const WithdrawTransactionUserView = require('../PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  let countResult = await WithdrawTransactionUserView.customCount(filter, undefined, undefined, startDate, endDate);
  if (countResult) {
    return countResult[0].count;
  }
  return 0;
}

async function countTotalPaymentBonus(filter, startDate, endDate) {
  const PaymentBonusTransactionUserView = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionUserView');
  let countResult = await PaymentBonusTransactionUserView.customCount(filter, undefined, undefined, startDate, endDate);
  if (countResult) {
    return countResult[0].count;
  }
  return 0;
}

module.exports = {
  countTotalStaffUser,
  countTotalNewUsers,
  countTotalAgency,
  sumTotalUserPaymentWithdraw,
  sumTotalUserPaymentWithdrawUSDT,
  sumTotalUserPaymentWithdrawVND,
  sumTotalUserPaymentDeposit,
  sumTotalUserPaymentDepositUSDT,
  sumTotalUserPaymentDepositVND,
  sumTotalUserPlaceBet,
  countTotalUserDepositByDate,
  countTotalUserDeposit,
  countTotalNewUserDeposit,
  countTotalUserWithdrawByDate,
  countTotalUserWithdraw,
  countTotalNewUserWithdraw,
  countTotalUserMissionCompletedByDate,
  countTotalUserMissionCompleted,
  countTotalNewUserMissionCompleted,
  sumTotalAmountMissionCompleted,
  countTotalUser,
  summaryUserPayment,
  summaryReferUser,
  sumTotal,
  countTotalMiningUser,
  CountMemberShip,
  summaryReferUserBonus,
  summaryReferUserTotal,
  sumaryWinLoseAmount,
  sumaryPointAmount,
  countTotalPaymentBonus,
  countTotalWithdrawDeposit,
  countTotalPaymentDeposit,
  syncStatistical,
};
