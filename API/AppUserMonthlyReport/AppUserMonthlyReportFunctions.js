/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const AppUserMonthlyReportResourceAccess = require('./resourceAccess/AppUserMonthlyReportResourceAccess');

const { isNotValidValue } = require('../ApiUtils/utilFunctions');
const moment = require('moment');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserMembershipResourceAccess = require('../AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
const { MAX_LEVEL_NUMBER } = require('../AppUserMembership/AppUserMembershipConstant');
const { REPORT_MONTH_DATA_FORMAT } = require('./AppUserMonthlyReportConstant');
const Logger = require('../../utils/logging');
async function increaseTotalPlayForSupervisorByUserId(appUserId, playAmount) {
  if (playAmount > 0) {
    let _currentUser = await AppUsersResourceAccess.findById(appUserId);
    for (let i = 1; i <= MAX_LEVEL_NUMBER; i++) {
      if (_currentUser[`memberReferIdF${i}`] && _currentUser[`memberReferIdF${i}`] > 0) {
        const { getSystemUserLevelByMembershipId } = require('../AppUserMembership/AppUserMembershipFunction');
        let _supervisorId = _currentUser[`memberReferIdF${i}`];
        let _supervisorUser = await AppUsersResourceAccess.findById(_supervisorId);
        let _systemLevelCount = await getSystemUserLevelByMembershipId(_supervisorUser.appUserMembershipId);
        if (_systemLevelCount >= i) {
          await increaseTotalPlayForSupervisorUser(_supervisorId, playAmount, i);
        }
      }
    }
  }
}

async function increaseTotalPlayForSupervisorUser(supervisorId, playAmount, systemLevelIndex) {
  if (playAmount > 0) {
    let monthlyReportId = await createMonthlyReportByUserId(supervisorId);
    if (monthlyReportId && systemLevelIndex && systemLevelIndex > 0) {
      let _monthlyReport = await AppUserMonthlyReportResourceAccess.findById(monthlyReportId);
      let _updateAmount = playAmount;
      if (_monthlyReport) {
        _updateAmount += _monthlyReport[`totalPlayF${systemLevelIndex}`];
      }

      let _dataUpdate = {};
      _dataUpdate[`totalPlayF${systemLevelIndex}`] = _updateAmount;
      await AppUserMonthlyReportResourceAccess.updateById(monthlyReportId, _dataUpdate);

      return monthlyReportId;
    }
    return undefined;
  }
}

async function increaseTotalPlayForUser(appUserId, playAmount) {
  if (playAmount > 0) {
    let monthlyReportId = await createMonthlyReportByUserId(appUserId);
    if (monthlyReportId) {
      let _monthlyReport = await AppUserMonthlyReportResourceAccess.findById(monthlyReportId);
      let _updateAmount = playAmount;
      if (_monthlyReport) {
        _updateAmount += _monthlyReport.totalPlay;
      }

      await AppUserMonthlyReportResourceAccess.updateById(monthlyReportId, {
        totalPlay: _updateAmount,
      });
      return monthlyReportId;
    }
    return undefined;
  }
}

//appUserId: id cua user duoc nhan hoa hong
async function createMonthlyReportByUserId(appUserId) {
  if (!appUserId || appUserId === null || appUserId === '' || appUserId === 0) {
    Logger.error(`cancel createMonthlyReportByUserId invalid appUserId ${appUserId}`);
    return;
  }

  let currentMonth = moment().format(REPORT_MONTH_DATA_FORMAT) * 1;
  let transactionData = {
    appUserId: appUserId,
    reportMonth: currentMonth,
  };
  let _existingReportRecord = await AppUserMonthlyReportResourceAccess.find(transactionData, 0, 1);
  if (_existingReportRecord && _existingReportRecord.length > 0) {
    return _existingReportRecord[0].appUserMonthlyReportId;
  }

  let result = await AppUserMonthlyReportResourceAccess.insert(transactionData);
  if (result) {
    return result[0];
  } else {
    Logger.error('insert bonus transaction error');
    return undefined;
  }
}

module.exports = {
  createMonthlyReportByUserId,
  increaseTotalPlayForUser,
  increaseTotalPlayForSupervisorUser,
  increaseTotalPlayForSupervisorByUserId,
};
