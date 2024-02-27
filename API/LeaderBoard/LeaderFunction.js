/* Copyright (c) 2022-2023 Reminano */

const GamePlayRecordsResourceAccess = require('../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const { DEPOSIT_TRX_STATUS } = require('../PaymentDepositTransaction/PaymentDepositTransactionConstant');
const PaymentDepositTransactionResourceAccess = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
const { WITHDRAW_TRX_STATUS } = require('../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant');
const PaymentWithdrawTransactionResourceAccess = require('../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');
const LeaderBoardResourAccess = require('./resourceAccess/LeaderBoardResourAccess');
const LeaderBoardDailyResourceAccess = require('./resourceAccess/LeaderBoardDailyResourceAccess');
const LeaderBoardDailyView = require('./resourceAccess/LeaderBoardDailyView');
const moment = require('moment');
const { DATE_DBDATA_FORMAT } = require('./LeaderBoardConstant');

async function updateTotalPlayForUser(appUserId) {
  let data = await _updateTotalPlay(appUserId);

  let _existingRecord = await LeaderBoardResourAccess.findById(appUserId);
  if (_existingRecord) {
    await LeaderBoardResourAccess.updateById(appUserId, {
      totalPlayAmount: data._totalPlayAmount,
      totalPlayWinAmount: data._totalPlayWinAmount,
      totalPlayLoseAmount: data._totalPlayLoseAmount,
      totalPlayLoseCount: data._totalPlayLoseCount,
      totalPlayWinCount: data._totalPlayWinCount,
      totalPlayCount: data._totalPlayCount,
      totalProfit: data._totalProfit,
    });
  } else {
    await LeaderBoardResourAccess.insert({
      appUserId: appUserId,
      totalPlayAmount: data._totalPlayAmount,
      totalPlayWinAmount: data._totalPlayWinAmount,
      totalPlayLoseAmount: data._totalPlayLoseAmount,
      totalPlayLoseCount: data._totalPlayLoseCount,
      totalPlayWinCount: data._totalPlayWinCount,
      totalPlayCount: data._totalPlayCount,
      totalProfit: data._totalProfit,
    });
  }
}

async function _updateTotalPlay(appUserId, startDate, endDate) {
  let _skip = 0;
  let _limit = 50;
  let _totalPlayAmount = 0;
  let _totalPlayWinAmount = 0;
  let _totalPlayLoseAmount = 0;
  let _totalPlayCount = 0;
  let _totalPlayLoseCount = 0;
  let _totalPlayWinCount = 0;
  let _totalProfit = 0;
  while (true) {
    let _allUserPlayRecord = await GamePlayRecordsResourceAccess.customSearch({ appUserId: appUserId }, _skip, _limit, startDate, endDate);
    if (_allUserPlayRecord && _allUserPlayRecord.length > 0) {
      for (let i = 0; i < _allUserPlayRecord.length; i++) {
        const _userPlayRecord = _allUserPlayRecord[i];
        _totalPlayAmount += _userPlayRecord.betRecordAmountIn;
        _totalPlayCount++;
        if (_userPlayRecord.betRecordWin > 0) {
          _totalPlayWinAmount += _userPlayRecord.betRecordWin;
          _totalPlayWinCount++;
        } else {
          _totalPlayLoseAmount += Math.abs(_userPlayRecord.betRecordWin);
          _totalPlayLoseCount++;
        }
        _totalProfit += _userPlayRecord.betRecordWin;
      }
    } else {
      break;
    }

    _skip += _limit;
  }
  return {
    _totalPlayAmount: _totalPlayAmount,
    _totalPlayWinAmount: _totalPlayWinAmount,
    _totalPlayLoseAmount: _totalPlayLoseAmount,
    _totalPlayCount: _totalPlayCount,
    _totalPlayLoseCount: _totalPlayLoseCount,
    _totalPlayWinCount: _totalPlayWinCount,
    _totalProfit: _totalProfit,
  };
}

async function updateTotalDepositForUser(appUserId) {
  let data = await _updateTotalDeposit(appUserId);

  let _existingRecord = await LeaderBoardResourAccess.findById(appUserId);
  if (_existingRecord) {
    await LeaderBoardResourAccess.updateById(appUserId, {
      totalDepositAmount: data._totalDepositAmount,
      totalDepositCount: data._totalDepositCount,
    });
  } else {
    await LeaderBoardResourAccess.insert({
      appUserId: appUserId,
      totalDepositAmount: data._totalDepositAmount,
      totalDepositCount: data._totalDepositCount,
    });
  }
}
async function _updateTotalDeposit(appUserId, startDate, endDate) {
  let _skip = 0;
  let _limit = 50;
  let _totalDepositAmount = 0;
  let _totalDepositCount = 0;
  while (true) {
    let _allUserRecord = await PaymentDepositTransactionResourceAccess.customSearch(
      { appUserId: appUserId, paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED },
      _skip,
      _limit,
      startDate,
      endDate,
    );
    if (_allUserRecord && _allUserRecord.length > 0) {
      for (let i = 0; i < _allUserRecord.length; i++) {
        const _userRecord = _allUserRecord[i];
        _totalDepositAmount += _userRecord.paymentAmount;
        _totalDepositCount++;
      }
    } else {
      break;
    }

    _skip += _limit;
  }
  return {
    _totalDepositAmount: _totalDepositAmount,
    _totalDepositCount: _totalDepositCount,
  };
}

async function updateTotalWithdrawForUser(appUserId) {
  let data = await _updateTotalWithdraw(appUserId);

  let _existingRecord = await LeaderBoardResourAccess.findById(appUserId);
  if (_existingRecord) {
    await LeaderBoardResourAccess.updateById(appUserId, {
      totalWithdrawAmount: data._totalWithdrawAmount,
      totalWithdrawCount: data._totalWithdrawCount,
    });
  } else {
    await LeaderBoardResourAccess.insert({
      appUserId: appUserId,
      totalWithdrawAmount: data._totalWithdrawAmount,
      totalWithdrawCount: data._totalWithdrawCount,
    });
  }
}

async function _updateTotalWithdraw(appUserId, startDate, endDate) {
  let _skip = 0;
  let _limit = 50;
  let _totalWithdrawAmount = 0;
  let _totalWithdrawCount = 0;
  while (true) {
    let _allUserRecord = await PaymentWithdrawTransactionResourceAccess.customSearch(
      { appUserId: appUserId, paymentStatus: WITHDRAW_TRX_STATUS.COMPLETED },
      _skip,
      _limit,
      startDate,
      endDate,
    );
    if (_allUserRecord && _allUserRecord.length > 0) {
      for (let i = 0; i < _allUserRecord.length; i++) {
        const _userRecord = _allUserRecord[i];
        _totalWithdrawAmount += _userRecord.paymentAmount;
        _totalWithdrawCount++;
      }
    } else {
      break;
    }

    _skip += _limit;
  }
  return {
    _totalWithdrawAmount: _totalWithdrawAmount,
    _totalWithdrawCount: _totalWithdrawCount,
  };
}

async function updateTotalDailyKLGD(day, skip, limit) {
  let searchStartDay = moment(day, DATE_DBDATA_FORMAT).startOf('days');
  let searchEndDay = moment(day, DATE_DBDATA_FORMAT).endOf('days');
  let _skip = 0;
  let _limit = 50;
  while (true) {
    let _allUserPlay = await GamePlayRecordsResourceAccess.customSearch({}, _skip, _limit, searchStartDay, searchEndDay);
    if (_allUserPlay && _allUserPlay.length > 0) {
      for (let i = 0; i < _allUserPlay.length; i++) {
        const _userPlayRecord = _allUserPlay[i];
        let today = moment().endOf('days');
        let diffToday = today.diff(searchEndDay, 'days');
        // Tìm trong DB xem có sẵn ngày này chưa
        let _existingRecord = await LeaderBoardDailyResourceAccess.find({ appUserId: _userPlayRecord.appUserId, leaderBoardDailyDate: day });
        if (_existingRecord && _existingRecord.length > 0) {
          if (!_existingRecord[0].totalPlayAmount || (_existingRecord[0].totalPlayAmount && diffToday == 0)) {
            let totalPlay = await _updateTotalPlay(_userPlayRecord.appUserId, searchStartDay, searchEndDay);
            await LeaderBoardDailyResourceAccess.updateById(_existingRecord[0].leaderBoardDailyId, {
              totalPlayAmount: totalPlay._totalPlayAmount,
              totalPlayWinAmount: totalPlay._totalPlayWinAmount,
              totalPlayLoseAmount: totalPlay._totalPlayLoseAmount,
              totalPlayLoseCount: totalPlay._totalPlayLoseCount,
              totalPlayWinCount: totalPlay._totalPlayWinCount,
              totalPlayCount: totalPlay._totalPlayCount,
              totalProfit: totalPlay._totalProfit,
            });
          }
        } else {
          // Nếu chưa thì tính vào up vào DB
          let totalPlay = await _updateTotalPlay(_userPlayRecord.appUserId, searchStartDay, searchEndDay);
          await LeaderBoardDailyResourceAccess.insert({
            appUserId: _userPlayRecord.appUserId,
            totalPlayAmount: totalPlay._totalPlayAmount,
            totalPlayWinAmount: totalPlay._totalPlayWinAmount,
            totalPlayLoseAmount: totalPlay._totalPlayLoseAmount,
            totalPlayLoseCount: totalPlay._totalPlayLoseCount,
            totalPlayWinCount: totalPlay._totalPlayWinCount,
            totalPlayCount: totalPlay._totalPlayCount,
            totalProfit: totalPlay._totalProfit,
            leaderBoardDailyDate: day,
            dateTime: moment(day, DATE_DBDATA_FORMAT).format('YYYYMMDD') * 1,
          });
        }
      }
    } else {
      break;
    }
    _skip += _limit;
  }
}

async function updateTotalDailyDeposit(day) {
  let searchStartDay = moment(day, DATE_DBDATA_FORMAT).startOf('days');
  let searchEndDay = moment(day, DATE_DBDATA_FORMAT).endOf('days');
  let _skip = 0;
  let _limit = 50;
  while (true) {
    let _allUserDeposit = await PaymentDepositTransactionResourceAccess.customSearch({}, _skip, _limit, searchStartDay, searchEndDay);
    if (_allUserDeposit && _allUserDeposit.length > 0) {
      for (let i = 0; i < _allUserDeposit.length; i++) {
        const _userPlayRecord = _allUserDeposit[i];
        let today = moment().endOf('days');
        let diffToday = today.diff(searchEndDay, 'days');
        // Tìm trong DB xem có sẵn ngày này chưa
        let _existingRecord = await LeaderBoardDailyResourceAccess.find({ appUserId: _userPlayRecord.appUserId, leaderBoardDailyDate: day });
        if (_existingRecord && _existingRecord.length > 0) {
          if (!_existingRecord[0].totalDepositAmount || (_existingRecord[0].totalDepositAmount && diffToday == 0)) {
            let totalDeposit = await _updateTotalDeposit(_userPlayRecord.appUserId, searchStartDay, searchEndDay);
            await LeaderBoardDailyResourceAccess.updateById(_existingRecord[0].leaderBoardDailyId, {
              totalDepositAmount: totalDeposit._totalDepositAmount,
              totalDepositCount: totalDeposit._totalDepositCount,
            });
          }
        } else {
          // Nếu chưa thì tính vào up vào DB
          let totalDeposit = await _updateTotalDeposit(_userPlayRecord.appUserId, searchStartDay, searchEndDay);
          await LeaderBoardDailyResourceAccess.insert({
            appUserId: _userPlayRecord.appUserId,
            totalDepositAmount: totalDeposit._totalDepositAmount,
            totalDepositCount: totalDeposit._totalDepositCount,
            leaderBoardDailyDate: day,
            dateTime: moment(day, DATE_DBDATA_FORMAT).format('YYYYMMDD') * 1,
          });
        }
      }
    } else {
      break;
    }
    _skip += _limit;
  }
}

async function updateTotalDailyWithdraw(day) {
  let searchStartDay = moment(day, DATE_DBDATA_FORMAT).startOf('days');
  let searchEndDay = moment(day, DATE_DBDATA_FORMAT).endOf('days');
  let _skip = 0;
  let _limit = 50;
  while (true) {
    let _allUserWithdraw = await PaymentWithdrawTransactionResourceAccess.customSearch({}, _skip, _limit, searchStartDay, searchEndDay);
    if (_allUserWithdraw && _allUserWithdraw.length > 0) {
      for (let i = 0; i < _allUserWithdraw.length; i++) {
        const _userPlayRecord = _allUserWithdraw[i];
        let today = moment().endOf('days');
        let diffToday = today.diff(searchEndDay, 'days');
        // Tìm trong DB xem có sẵn ngày này chưa
        let _existingRecord = await LeaderBoardDailyResourceAccess.find({ appUserId: _userPlayRecord.appUserId, leaderBoardDailyDate: day });
        if (_existingRecord && _existingRecord.length > 0) {
          if (!_existingRecord[0].totalWithdrawAmount || (_existingRecord[0].totalWithdrawAmount && diffToday == 0)) {
            let totalDeposit = await _updateTotalWithdraw(_userPlayRecord.appUserId, searchStartDay, searchEndDay);
            await LeaderBoardDailyResourceAccess.updateById(_existingRecord[0].leaderBoardDailyId, {
              totalWithdrawAmount: totalDeposit._totalWithdrawAmount,
              totalWithdrawCount: totalDeposit._totalWithdrawCount,
            });
          }
        } else {
          // Nếu chưa thì tính vào up vào DB
          let totalDeposit = await _updateTotalWithdraw(_userPlayRecord.appUserId, searchStartDay, searchEndDay);
          await LeaderBoardDailyResourceAccess.insert({
            appUserId: _userPlayRecord.appUserId,
            totalWithdrawAmount: totalDeposit._totalWithdrawAmount,
            totalWithdrawCount: totalDeposit._totalWithdrawCount,
            leaderBoardDailyDate: day,
            dateTime: moment(day, DATE_DBDATA_FORMAT).format('YYYYMMDD') * 1,
          });
        }
      }
    } else {
      break;
    }
    _skip += _limit;
  }
}

async function updateTotalPlayForAllUser(startDate = moment().startOf('day').format()) {
  let _skip = 0;
  let _limit = 50;
  while (true) {
    let _allUserPlayRecord = await GamePlayRecordsResourceAccess.customSearch({}, _skip, _limit, startDate);
    if (_allUserPlayRecord && _allUserPlayRecord.length > 0) {
      for (let i = 0; i < _allUserPlayRecord.length; i++) {
        const _userPlayRecord = _allUserPlayRecord[i];
        await updateTotalPlayForUser(_userPlayRecord.appUserId);
      }
    } else {
      break;
    }

    _skip += _limit;
  }
}

async function updateTotalDepositForAllUser(startDate = moment().add(5, 'minute').format()) {
  let _skip = 0;
  let _limit = 50;
  while (true) {
    let _allUserRecord = await PaymentDepositTransactionResourceAccess.customSearch({}, _skip, _limit, startDate);
    if (_allUserRecord && _allUserRecord.length > 0) {
      for (let i = 0; i < _allUserRecord.length; i++) {
        const _userRecord = _allUserRecord[i];
        await updateTotalDepositForUser(_userRecord.appUserId);
      }
    } else {
      break;
    }

    _skip += _limit;
  }
}

async function updateTotalWithdrawForAllUser(startDate = moment().add(5, 'minute').format()) {
  let _skip = 0;
  let _limit = 50;
  while (true) {
    let _allUserRecord = await PaymentWithdrawTransactionResourceAccess.customSearch({}, _skip, _limit, undefined, startDate);
    if (_allUserRecord && _allUserRecord.length > 0) {
      for (let i = 0; i < _allUserRecord.length; i++) {
        const _userRecord = _allUserRecord[i];
        await updateTotalWithdrawForUser(_userRecord.appUserId);
      }
    } else {
      break;
    }

    _skip += _limit;
  }
}

module.exports = {
  updateTotalDepositForUser,
  updateTotalPlayForUser,
  updateTotalWithdrawForUser,
  updateTotalPlayForAllUser,
  updateTotalWithdrawForAllUser,
  updateTotalDepositForAllUser,
  updateTotalDailyKLGD,
  updateTotalDailyDeposit,
  updateTotalDailyWithdraw,
};
