/* Copyright (c) 2023-2024 Reminano */

const AppUsersResourceAccess = require('./resourceAccess/AppUsersResourceAccess');
const AppUserMembershipResourceAccess = require('../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
const GamePlayRecordsResourceAccess = require('../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');
const utilitiesFunction = require('../ApiUtils/utilFunctions');
const moment = require('moment');
const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
const { LEVER_MEMBERSHIP } = require('../AppUserMembership/AppUserMembershipConstant');
const PaymentBonusTransactionResourceAccess = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
const {
  getMaxSystemUserLevelByMembership,
  getMemberReferObjectByMembershipId,
  getSystemUserLevelByMembershipId,
} = require('../AppUserMembership/AppUserMembershipFunction');
const Logger = require('../../utils/logging');
const PaymentBonusDailyReportResourceAccess = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusDailyReportResourceAccess');
const PaymentBonusDailyReportView = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusDailyReportView');

async function calculateTotalUserReferF1(appUserId) {
  const total = await AppUsersResourceAccess.count({ memberReferIdF1: appUserId });
  if (total && total.length > 0) {
    return total[0].count;
  }
  return 0;
}

async function calculateTotalUserReferF1ByDate(appUserId, startDate, endDate) {
  const total = await AppUsersResourceAccess.customCount({ memberReferIdF1: appUserId }, 0, 0, startDate, endDate);
  if (total && total.length > 0) {
    return total[0].count;
  }
  return 0;
}

async function calculateTotalUserRefer(appUserId) {
  const total = await AppUsersResourceAccess.countReferedUserByUserId({ appUserId: appUserId });
  if (total && total.length > 0) {
    return total[0].count;
  }
  return 0;
}

async function calculateTotalUserReferByDate(appUserId, startDate, endDate) {
  const total = await AppUsersResourceAccess.countReferedUserByUserId({ appUserId: appUserId }, startDate, endDate);
  if (total && total.length > 0) {
    return total[0].count;
  }
  return 0;
}

async function calculateTotalAgent(appUserId) {
  const memberReferObject = {
    appUserId: appUserId,
  };
  const userRefers = await AppUsersResourceAccess.findReferedUserByUserId(memberReferObject);
  let totalAgent = 0;
  for (let index = 0; index < userRefers.length; index++) {
    const agent = userRefers[index];
    const userReferCount = await AppUsersResourceAccess.countReferedUserByUserId({ appUserId: agent.appUserId });
    if (userReferCount && userReferCount.length > 0) {
      if (userReferCount[0].count > 0) {
        totalAgent++;
      }
    }
  }
  return totalAgent;
}

async function calculateTotalAgentByDate(appUserId, startDate, endDate) {
  const memberReferObject = {
    appUserId: appUserId,
  };
  const userRefers = await AppUsersResourceAccess.findReferedUserByUserId(memberReferObject, undefined, undefined, startDate, endDate);
  let totalAgent = 0;
  for (let index = 0; index < userRefers.length; index++) {
    const agent = userRefers[index];
    const userReferCount = await AppUsersResourceAccess.countReferedUserByUserId({ appUserId: agent.appUserId }, startDate, endDate);
    if (userReferCount && userReferCount.length > 0) {
      if (userReferCount[0].count > 0) {
        totalAgent++;
      }
    }
  }
  return totalAgent;
}

async function calculateTotalF1TradeByWeek(appUserId, startDate, endDate) {
  const userF1s = await AppUsersResourceAccess.find({ memberReferIdF1: appUserId });
  let totalF1Trade = 0;
  let totalAmountF1Trade = 0;
  for (let index = 0; index < userF1s.length; index++) {
    const user = userF1s[index];
    const trades = await GamePlayRecordsResourceAccess.customCount({ appUserId: user.appUserId }, startDate, endDate);
    if (trades && trades[0].count > 0) {
      totalF1Trade++;
      const playAmount = await GamePlayRecordsResourceAccess.customSum('betRecordAmountIn', { appUserId: user.appUserId }, startDate, endDate);
      if (playAmount && playAmount[0].sumResult) {
        totalAmountF1Trade += playAmount[0].sumResult;
      }
    }
  }
  return { totalF1Trade, totalAmountF1Trade };
}

async function calculateTotalUserReferTradeByDay(appUserId, appUserMembershipId, startDate, endDate) {
  let _totalTrade = 0;
  let _totalAmountBonus = 0;
  let _systemLevelCount = await getSystemUserLevelByMembershipId(appUserMembershipId);
  let _result = { totalTrade: 0, totalAmountBonus: 0 };
  if (_systemLevelCount > 0) {
    const userRefers = await AppUsersResourceAccess.customSearchByUserMembership(appUserId, _systemLevelCount, {});

    for (let index = 0; index < userRefers.length; index++) {
      const user = userRefers[index];

      const trades = await GamePlayRecordsResourceAccess.customCount({ appUserId: user.appUserId }, startDate, endDate);
      if (trades && trades[0].count > 0) {
        _totalTrade++;
      }
    }
    const PaymentBonusTransactionResourceAccess = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
    let _sumResult = await PaymentBonusTransactionResourceAccess.customSum({ appUserId: appUserId }, startDate, endDate, 'paymentAmount');

    if (_sumResult && _sumResult.length > 0) {
      _sumResult = _sumResult[0].sumResult;
    }

    const _totalAmountBonus = _sumResult;
    _result.totalAmountBonus = _totalAmountBonus;
  }

  _result.totalTrade = _totalTrade;
  return _result;
}

async function calculatePlayAmountByMonth(appUserId, systemLevelCount, startDate, endDate) {
  const AppUserMonthlyReportResourceAccess = require('../AppUserMonthlyReport/resourceAccess/AppUserMonthlyReportResourceAccess');
  let _order = {
    key: 'reportMonth',
    value: 'desc',
  };
  let _existingReports = await AppUserMonthlyReportResourceAccess.customSearch(
    {
      appUserId: appUserId,
    },
    0,
    5,
    startDate,
    endDate,
  );
  if (_existingReports && _existingReports.length > 0) {
    return { month: moment(startDate).format('MM/YYYY'), totalPlayAmount: totalAmount[0].sumResult };
  } else {
    return { month: moment(startDate).format('MM/YYYY'), totalPlayAmount: 0 };
  }
}

async function userSummaryBonusAmountByDate(appUserId, startDate, endDate, skip, limit) {
  let _startDate = moment(startDate).startOf('day');
  let _endDate = moment(endDate).endOf('day');
  let today = moment().endOf('day');
  let startProjectDate = moment([2023, 9, 30]).startOf('day');
  let summaryResult = [];
  let isToday = false;
  let count = 0;

  if (skip) {
    _endDate = moment(_endDate).add((skip / 6) * -1, 'days');
  }
  for (let i = _endDate; i >= _startDate; ) {
    // if (skip) {
    //   i = moment(i).add((skip / 6) * -1, 'days');
    //   // if(appUserMembershipId == 2){
    //   //   i = moment(i).add((skip / 12) * -12, 'days');
    //   // } else if(appUserMembershipId == 3){
    //   //   i = moment(i).add((skip / 12) * -6, 'days');
    //   // } else if(appUserMembershipId == 4){
    //   //   i = moment(i).add((skip / 12) * -4, 'days');
    //   // } else if(appUserMembershipId == 5){
    //   //   i = moment(i).add((skip / 12) * -3, 'days');
    //   // }  else if(appUserMembershipId == 6){
    //   //   i = moment(i).add((skip / 10) * -2, 'days');
    //   // }  else if(appUserMembershipId == 7){
    //   //   i = moment(i).add((skip / 12) * -2, 'days');
    //   // }
    // }
    let diffToday = today.diff(i, 'days');
    if (diffToday == 0) {
      isToday = true;
    }
    // Tìm ngày report có sẵn trong DB chưa
    let date = moment(i).format('YYYY/MM/DD');
    let paymentReport = await PaymentBonusDailyReportView.find({ appUserId: appUserId, summaryDate: date });
    // Nếu có => push vào kết quả
    if (paymentReport && paymentReport.length > 0) {
      for (let index = 0; index < paymentReport.length; index++) {
        // if(paymentReport[index].referLevel < appUserMembershipId){
        summaryResult.push({
          appUserId: paymentReport[index].appUserId,
          summaryDate: paymentReport[index].summaryDate,
          referLevel: paymentReport[index].referLevel,
          totalPlayCount: paymentReport[index].totalPlayCount,
          totalUserPlayCount: paymentReport[index].totalUserPlayCount,
          totalPlayAmount: paymentReport[index].totalPlayAmount,
          totalBonus: paymentReport[index].totalBonus,
        });
        // }
      }
    } else {
      // nếu trước ngày 30/09 thì không tính
      if (i < startProjectDate) {
        break;
      }
      // nếu không có => sum
      let bonusAmount = await calculateBonusAmountByDate(appUserId, i);
      if (bonusAmount && bonusAmount.length > 0) {
        for (let index = 0; index < bonusAmount.length; index++) {
          bonusAmount[index].appUserId = appUserId;
          bonusAmount[index].dateId = `${appUserId}${bonusAmount[index].referLevel}${moment(i).format('YYYYMMDD')}`;
          // if (bonusAmount[index].referLevel < appUserMembershipId) {
          summaryResult.push(bonusAmount[index]);
          // }
        }
      } else {
        for (let i = 1; i < 7; i++) {
          bonusAmount.push({
            appUserId: appUserId,
            summaryDate: date,
            referLevel: i,
            totalPlayCount: 0,
            totalUserPlayCount: 0,
            totalPlayAmount: 0,
            totalBonus: 0,
            dateId: `${appUserId}${i}${moment(i).format('YYYYMMDD')}`,
          });
        }
        for (let i = 0; i < bonusAmount.length; i++) {
          // if(bonusAmount[i].referLevel < appUserMembershipId){
          summaryResult.push(bonusAmount[i]);
          // }
        }
      }
      await PaymentBonusDailyReportResourceAccess.insert(bonusAmount);
    }
    i = moment(i).add(-1, 'days');
    count += 6;
    if (limit) {
      if (count >= limit) {
        break;
      }
    }
  }
  return { summaryResult, count: summaryResult.length, isToday };
}

async function calculateBonusAmountByDate(appUserId, date) {
  let result = [];
  await Promise.all([
    _calculateUserReferTrade(appUserId, date, 1),
    _calculateUserReferTrade(appUserId, date, 2),
    _calculateUserReferTrade(appUserId, date, 3),
    _calculateUserReferTrade(appUserId, date, 4),
    _calculateUserReferTrade(appUserId, date, 5),
    _calculateUserReferTrade(appUserId, date, 6),
  ])
    .then(res => {
      for (let index = 0; index < res.length; index++) {
        const element = res[index];
        if (element && element.length > 0) {
          result.push(element[0]);
        }
      }
    })
    .catch(error => Logger.error(`${new Date()}-[Error]: calculateBonusAmountByDate appUserId: ${appUserId}`, error));
  return result;
}

async function _calculateUserReferTrade(appUserId, date, level) {
  let result = [];
  const userRefers = await _getUserReferByF(appUserId, level);
  if (userRefers && userRefers.length > 0) {
    let totalTrade = 0;
    let totalUserTrade = 0;
    let totalAmountTrade = 0;
    for (let index = 0; index < userRefers.length; index++) {
      const userRefer = userRefers[index];
      const playData = await _calculatePlayAmount(userRefer.appUserId, date);
      if (playData && playData.totalTrade > 0) {
        totalTrade += playData.totalTrade;
        totalUserTrade += playData.totalUserTrade;
        totalAmountTrade += playData.totalAmountTrade;
      }
    }
    if (totalTrade > 0) {
      let _bonusSummaryRecord = {
        summaryDate: moment(date).format('YYYY/MM/DD'),
        referLevel: level,
        totalPlayCount: totalTrade,
        totalUserPlayCount: totalUserTrade,
        totalPlayAmount: totalAmountTrade,
        totalBonus: 0,
      };

      for (let index = 0; index < userRefers.length; index++) {
        const userRefer = userRefers[index];
        const PaymentBonusTransaction = require('../PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
        const startDate = moment(date).startOf('days').format();
        const endDate = moment(date).endOf('days').format();
        let _sumTotalBonusResult = await PaymentBonusTransaction.customSum(
          { appUserId: appUserId, referUserId: userRefer.appUserId },
          startDate,
          endDate,
          `paymentAmountF${level}`,
        );
        if (_sumTotalBonusResult && _sumTotalBonusResult.length > 0) {
          _bonusSummaryRecord.totalBonus += _sumTotalBonusResult[0].sumResult;
        }
      }
      result.push(_bonusSummaryRecord);
    } else {
      result.push({
        summaryDate: moment(date).format('YYYY/MM/DD'),
        referLevel: level,
        totalPlayCount: 0,
        totalUserPlayCount: 0,
        totalPlayAmount: 0,
        totalBonus: 0,
      });
    }
  }
  return result;
}

async function _getTotalBonusByF(appUserId, date, level) {
  let _startDate = moment(date).add(1, 'day').startOf('days').format();
  let _endDate = moment(date).add(1, 'day').endOf('day').format();
  const field = `paymentAmountF${level}`;
  const totalBonus = await PaymentBonusTransactionResourceAccess.customSum({ appUserId: appUserId }, _startDate, _endDate, field);
  if (totalBonus && totalBonus.length > 0) {
    return totalBonus[0].sumResult;
  }
  return 0;
}

async function _getUserReferByF(appUserId, level) {
  let _memberReferObject = {};
  switch (level) {
    case 1:
      _memberReferObject = {
        memberReferIdF1: appUserId,
      };
      return await AppUsersResourceAccess.findReferedUserByUserId(_memberReferObject);
    case 2:
      _memberReferObject = {
        memberReferIdF2: appUserId,
      };
      return await AppUsersResourceAccess.findReferedUserByUserId(_memberReferObject);
    case 3:
      _memberReferObject = {
        memberReferIdF3: appUserId,
      };
      return await AppUsersResourceAccess.findReferedUserByUserId(_memberReferObject);
    case 4:
      _memberReferObject = {
        memberReferIdF4: appUserId,
      };
      return await AppUsersResourceAccess.findReferedUserByUserId(_memberReferObject);
    case 5:
      _memberReferObject = {
        memberReferIdF5: appUserId,
      };
      return await AppUsersResourceAccess.findReferedUserByUserId(_memberReferObject);
    case 6:
      _memberReferObject = {
        memberReferIdF6: appUserId,
      };
      return await AppUsersResourceAccess.findReferedUserByUserId(_memberReferObject);
    default:
      return [];
  }
}

async function _calculatePlayAmount(appUserId, date) {
  let totalTrade = 0;
  let totalUserTrade = 0;
  let totalAmountTrade = 0;
  try {
    const startDate = moment(date).startOf('days').format();
    const endDate = moment(date).endOf('days').format();
    const trades = await GamePlayRecordsResourceAccess.customCount({ appUserId: appUserId }, startDate, endDate);
    if (trades && trades[0].count > 0) {
      totalTrade = trades[0].count;
      totalUserTrade++;
      const playAmount = await GamePlayRecordsResourceAccess.customSum('betRecordAmountIn', { appUserId: appUserId }, startDate, endDate);
      if (playAmount && playAmount[0].sumResult) {
        totalAmountTrade += playAmount[0].sumResult;
      }
    }
  } catch (error) {
    Logger.error(error);
  }
  return { totalTrade, totalUserTrade, totalAmountTrade };
}

async function _calculateUserPlayAmountByDate(appUserId, startDate, endDate) {
  const playAmount = await GamePlayRecordsResourceAccess.customSum('betRecordAmountIn', { appUserId: appUserId }, startDate, endDate);
  if (playAmount && playAmount[0].sumResult) {
    return playAmount[0].sumResult;
  }
  return 0;
}

async function fetchSystemUserList(appUserId, childLevel = 1, skip, limit) {
  let _filter = {};

  if (childLevel === 1) {
    _filter.memberReferIdF1 = appUserId;
  }

  if (childLevel === 2) {
    _filter.memberReferIdF2 = appUserId;
  }

  if (childLevel === 3) {
    _filter.memberReferIdF3 = appUserId;
  }

  if (childLevel === 4) {
    _filter.memberReferIdF4 = appUserId;
  }

  if (childLevel === 5) {
    _filter.memberReferIdF5 = appUserId;
  }

  if (childLevel === 6) {
    _filter.memberReferIdF6 = appUserId;
  }

  if (childLevel === 7) {
    _filter.memberReferIdF7 = appUserId;
  }

  if (childLevel === 8) {
    _filter.memberReferIdF8 = appUserId;
  }

  if (childLevel === 9) {
    _filter.memberReferIdF9 = appUserId;
  }

  if (childLevel === 10) {
    _filter.memberReferIdF10 = appUserId;
  }
  let _userList = await AppUsersResourceAccess.find(_filter, skip, limit);
  return _userList;
}

module.exports = {
  calculateBonusAmountByDate,
  calculateTotalUserReferF1,
  calculateTotalUserReferF1ByDate,
  calculateTotalUserRefer,
  calculateTotalUserReferByDate,
  calculateTotalAgent,
  calculateTotalAgentByDate,
  calculateTotalF1TradeByWeek,
  calculateTotalUserReferTradeByDay,
  calculatePlayAmountByMonth,
  userSummaryBonusAmountByDate,
  fetchSystemUserList,
};
