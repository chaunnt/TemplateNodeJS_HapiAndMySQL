/* Copyright (c) 2022-2023 Reminano */

'use strict';
const moment = require('moment');

const {
  MISSION_STATUS,
  MISSION_BONUS_AMOUNT,
  MISSION_BONUS_PERCENTAGE,
  MISSION_BONUS_REFERAL_AMOUNT,
  MISSION_DAY_DATA_FORMAT,
  USER_MISSION_ERROR,
  MISSION_BONUS_HALF_AMOUNT,
} = require('./AppUserMissionConstant');
const AppUserMissionInfoResourceAccess = require('./resourceAccess/AppUserMissionInfoResourceAccess');
const AppUserMissionHistoryResourceAccess = require('./resourceAccess/AppUserMissionHistoryResourceAccess');
const AppUserMissionPlayResourceAccess = require('../GamePlayRecords/resourceAccess/AppUserMissionPlayResourceAccess');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserMissionHistoryView = require('../AppUserMission/resourceAccess/AppUserMissionHistoryView');
const AppUserMissionInfoView = require('../AppUserMission/resourceAccess/AppUserMissionInfoView');
const { isNotValidValue, isNotEmptyStringValue, isValidValue } = require('../ApiUtils/utilFunctions');
const { increasePointBalance, rewardMissionBonus, rewardMissionReferralBonus } = require('../WalletRecord/WalletRecordFunction');
const { BET_RESULT, BET_STATUS } = require('../GamePlayRecords/GamePlayRecordsConstant');

const { getSystemConfig } = require('../SystemConfigurations/SystemConfigurationsFunction');
const { BONUS_PAYMENT_DATE_DB_FORMAT } = require('../PaymentBonusTransaction/PaymentBonusTransactionConstant');
const { DATETIME_DATA_ISO_FORMAT } = require('../Common/CommonConstant');
const Logger = require('../../utils/logging');
const { PAYMENT_TYPE } = require('../PaymentMethod/PaymentMethodConstant');
const { publishJSONToClient } = require('../../ThirdParty/SocketIO/SocketIOClient');

async function checkReadyToStartUserMission(appUserId) {
  let __existingMissionId = null;
  let _existingMission = await getProcessingMissionOfUser(appUserId);
  if (_existingMission) {
    __existingMissionId = _existingMission.appUserMissionHistoryId;
  } else {
    _existingMission = await startNewMission(appUserId);
    if (isValidValue(_existingMission)) {
      __existingMissionId = _existingMission.appUserMissionHistoryId;
    }
  }

  if (isNotValidValue(__existingMissionId)) {
    Logger.error(`error checkReadyToStartUserMission __existingMissionId ${__existingMissionId}: `);
    throw USER_MISSION_ERROR.MISSION_ALREADY_FINISHED;
  }

  let _countPlayRecordOfMission = await fetchPlayRecordOfMission(_existingMission.appUserMissionHistoryId);
  if (_countPlayRecordOfMission && _countPlayRecordOfMission.length >= 2) {
    Logger.error(`error _countPlayRecordOfMission fetchPlayRecordOfMission`);
    throw USER_MISSION_ERROR.MISSION_ALREADY_FINISHED;
  }
  return __existingMissionId;
}

async function getUserMissionInfo(appUserId) {
  let _userMission = await AppUserMissionInfoResourceAccess.findById(appUserId);
  if (!_userMission) {
    await AppUserMissionInfoResourceAccess.insert({ appUserId: appUserId });
    _userMission = await AppUserMissionInfoResourceAccess.findById(appUserId);
  }

  let _playMission = await getProcessingMissionOfUser(appUserId);
  if (_playMission) {
    _userMission.mission = _playMission;
    let _playRecord = await fetchPlayRecordOfMission(_playMission.appUserMissionHistoryId);
    if (_playRecord && _playRecord.length > 0) {
      _userMission.mission.playRecord = _playRecord;
    }
  }

  return _userMission;
}

async function updateMissionHistoryStatus(appUserMissionHistoryId) {
  let _userMission = await AppUserMissionHistoryResourceAccess.findById(appUserMissionHistoryId);
  if (!_userMission) {
    Logger.error(`updateMissionHistoryStatus invalid _userMission ${appUserMissionHistoryId}`);
  }
  if (_userMission.missionStatus !== MISSION_STATUS.NEW) {
    _userMission.missonPlays = await fetchPlayRecordOfMission(appUserMissionHistoryId);
  } else {
    _userMission.missonPlays = [];
  }

  if (_userMission.missonPlays && _userMission.missonPlays.length >= 2 && _userMission.missionStatus === MISSION_STATUS.IN_PROGRESS) {
    if (
      _userMission.missonPlays[0].betRecordStatus === BET_STATUS.COMPLETED &&
      _userMission.missonPlays[1].betRecordStatus === BET_STATUS.COMPLETED
    ) {
      await closeMission(appUserMissionHistoryId);
    }
  }
}
async function fetchPlayRecordOfMission(appUserMissionHistoryId) {
  let _order = {
    key: 'createdAt',
    value: 'desc',
  };
  let _existingPlayRecord = await AppUserMissionPlayResourceAccess.find(
    {
      appUserMissionHistoryId: appUserMissionHistoryId,
    },
    0,
    undefined,
    _order,
  );

  if (_existingPlayRecord && _existingPlayRecord.length > 0) {
    return _existingPlayRecord;
  }
  return undefined;
}

async function increaseUserDailyMission(appUserId, bonusMissionForReferUser) {
  let _userMission = await getUserMissionInfo(appUserId);
  if (_userMission) {
    let systemConfig = await getSystemConfig();
    let maxLimitedMissionPerDay = systemConfig.maxLimitedMissionPerDay;
    if (_userMission.maxMissionCount < maxLimitedMissionPerDay) {
      await AppUserMissionInfoResourceAccess.updateById(appUserId, {
        maxMissionCount: _userMission.maxMissionCount + bonusMissionForReferUser,
      });
    }
    return true;
  }
  return undefined;
}

async function resetUserDailyMissionInfo(appUserId) {
  let _userMission = await getUserMissionInfo(appUserId);
  if (_userMission) {
    await AppUserMissionInfoResourceAccess.updateById(appUserId, {
      maxMissionCount: 0,
      remainingMissionCount: 0,
      missionCompletedCount: 0,
    });
    await addFirstMissionForUser(appUserId);
    return true;
  }
  return undefined;
}

async function updateUserMissionInfo(appUserId) {
  let _userMission = await getUserMissionInfo(appUserId);

  let startDate = moment().startOf('day').format();
  let endDate = moment().endOf('day').format();

  let _RemainingTodyMissionCount = 0;
  if (_userMission && _userMission.maxMissionCount > 0) {
    _RemainingTodyMissionCount = await AppUserMissionHistoryResourceAccess.customCount(
      {
        appUserId: appUserId,
        missionStatus: [MISSION_STATUS.NEW, MISSION_STATUS.IN_PROGRESS],
      },
      startDate,
      endDate,
    );
    if (_RemainingTodyMissionCount && _RemainingTodyMissionCount.length > 0) {
      _RemainingTodyMissionCount = _RemainingTodyMissionCount[0].count;
    } else {
      _RemainingTodyMissionCount = 0;
    }
  }

  await AppUserMissionInfoResourceAccess.updateById(appUserId, {
    remainingMissionCount: _RemainingTodyMissionCount,
  });

  _userMission = await AppUserMissionInfoResourceAccess.findById(appUserId);

  return _userMission;
}

async function getProcessingMissionOfUser(appUserId) {
  let _order = {
    key: 'missionIndex',
    value: 'asc',
  };
  let _userMission = await AppUserMissionHistoryResourceAccess.customSearch(
    {
      missionStatus: MISSION_STATUS.IN_PROGRESS,
      appUserId: appUserId,
      missionStartDay: moment().format(MISSION_DAY_DATA_FORMAT),
    },
    0,
    1,
    undefined,
    undefined,
    undefined,
    _order,
  );
  if (_userMission && _userMission.length > 0) {
    return _userMission[0];
  } else {
    return undefined;
  }
}

async function addFirstMissionForUser(appUserId) {
  if (appUserId) {
    let _existingInfoMission = await getUserMissionInfo(appUserId);
    if (_existingInfoMission) {
      if (_existingInfoMission.maxMissionCount === 0) {
        let _existingUser = await AppUsersResourceAccess.findById(appUserId);
        let _isQualified = await _isUserQualifiedToHaveMission(_existingUser);
        if (_isQualified) {
          let systemConfig = await getSystemConfig();
          await increaseUserDailyMission(appUserId, systemConfig.maxLimitedMissionPerDay);
          await reloadDailyMission(appUserId);
          await updateUserMissionInfo(appUserId);
          return true;
        }
      }
    }
  }
  return undefined;
}

async function _isUserQualifiedToHaveMission(user) {
  let _result = false;
  //phai xác thực rồi
  if (isNotEmptyStringValue(user.email) && isNotEmptyStringValue(user.firstName) && isNotEmptyStringValue(user.secondaryPassword)) {
    const PaymentMethodResourceAccess = require('../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
    // phải kích hoạt phương thức thanh toán rồi thì mới có nhiệm vụ
    let _paymentMethod = await PaymentMethodResourceAccess.find({ appUserId: user.appUserId, paymentMethodType: PAYMENT_TYPE.ATM_BANK });
    if (_paymentMethod && _paymentMethod.length > 0) {
      _result = true;
    }
  }
  return _result;
}
async function reloadDailyMission(appUserId, referUserId) {
  //1 ngay chi cap phat 1 nhiem vu
  let _maxMissionCount = 1;
  let _newMissionCount = 1;
  let _existingInfoMission = await AppUserMissionInfoResourceAccess.findById(appUserId);
  if (_existingInfoMission) {
    _maxMissionCount = _existingInfoMission.maxMissionCount;
    _newMissionCount = _existingInfoMission.maxMissionCount;
    if (_newMissionCount * 1 >= 5) {
      _newMissionCount = 5;
    }
  }
  for (let i = 0; i < _newMissionCount; i++) {
    await _addNewUserMission(appUserId, _maxMissionCount, referUserId);
  }
}

async function _addNewUserMission(appUserId, maxMissionCount, referUserId) {
  let _missionData = {
    missionStatus: MISSION_STATUS.NEW,
    appUserId: appUserId,
    missionStartDay: moment().format(MISSION_DAY_DATA_FORMAT),
  };

  let _userMissionToday = await AppUserMissionHistoryResourceAccess.customSearch({
    appUserId: appUserId,
    missionStartDay: moment().format(MISSION_DAY_DATA_FORMAT),
  });
  let systemConfig = await getSystemConfig();
  let maxLimitedMissionPerDay = systemConfig.maxLimitedMissionPerDay;
  if (_userMissionToday.length >= maxLimitedMissionPerDay || (maxMissionCount && _userMissionToday.length >= maxMissionCount)) {
    return;
  }

  if (referUserId) {
    _missionData.referUserId = referUserId;
  }

  _missionData.missionIndex = _userMissionToday.length + 1;

  let _newUserMission = await AppUserMissionHistoryResourceAccess.insert(_missionData);

  if (_newUserMission) {
    return _newUserMission[0];
  } else {
    Logger.error(`_newUserMission AppUserMissionHistoryResourceAccess.insert Failed`);
    return undefined;
  }
}

async function startNewMission(appUserId) {
  let _userMission = await AppUserMissionHistoryResourceAccess.find(
    {
      missionStatus: MISSION_STATUS.NEW,
      appUserId: appUserId,
      missionStartDay: moment().format(MISSION_DAY_DATA_FORMAT),
    },
    0,
    1,
    {
      key: 'missionIndex',
      value: 'asc',
    },
  );
  if (_userMission && _userMission.length > 0) {
    await AppUserMissionHistoryResourceAccess.updateById(_userMission[0].appUserMissionHistoryId, {
      missionStatus: MISSION_STATUS.IN_PROGRESS,
      missionStartDate: moment().format(),
      missionStartTime: moment().format('HH:mm'),
    });
    return _userMission[0];
  } else {
    return undefined;
  }
}

async function _reduceRemainingMissionCount(appUserId) {
  let _missionInfo = await AppUserMissionInfoResourceAccess.findById(appUserId);
  if (_missionInfo && _missionInfo.remainingMissionCount > 0) {
    await AppUserMissionInfoResourceAccess.updateById(appUserId, {
      remainingMissionCount: _missionInfo.remainingMissionCount - 1,
    });
  }
}

async function _updateMissionCompleteDate(appUserId) {
  //cap nhat tien do nhiem vu
  const appUserMission = await AppUserMissionInfoResourceAccess.findById(appUserId);
  if (appUserMission) {
    await AppUserMissionInfoResourceAccess.updateById(appUserId, {
      lastUpdateMissionCompletedAt: new Date(),
      lastUpdateMissionCompletedAtTimestamp: new Date() * 1,
    });
  } else {
    await AppUserMissionInfoResourceAccess.insert({
      appUserId: appUserId,
      lastUpdateMissionCompletedAt: new Date(),
      lastUpdateMissionCompletedAtTimestamp: new Date() * 1,
    });
  }
}
async function _failureMission(appUserMissionHistoryId, missionStatus = MISSION_STATUS.FAILED) {
  await AppUserMissionHistoryResourceAccess.updateById(appUserMissionHistoryId, {
    missionStatus: missionStatus,
  });
}

async function addBonusMissionForReferUser(appUserId, referUserId) {
  Logger.info(`addBonusMissionForReferUser ${appUserId} ${referUserId}`);
  //CAN THAN: cho nay la thuong nhiem vu cho nguoi gioi thieu.
  //referUserId la nguoi nhan thuong (nguoi gioi thieu)
  //appUserId la phan thuong xuat phat tu nguoi nay
  let _todayStart = moment().startOf('day').format();
  let _existingReferMission = await AppUserMissionHistoryResourceAccess.customSearch(
    {
      appUserId: referUserId,
      referUserId: appUserId,
    },
    0,
    1,
    _todayStart,
  );
  //neu da thuong nhiem vu thi se khong thuong nua
  if (_existingReferMission && _existingReferMission.length > 0) {
    return;
  }
  let systemConfig = await getSystemConfig();
  let bonusMissionForReferUser = systemConfig.bonusMissionForReferUser;
  await increaseUserDailyMission(referUserId, bonusMissionForReferUser);
  //CAN THAN: cho nay la thuong nhiem vu cho nguoi gioi thieu.
  //referUserId la nguoi nhan thuong (nguoi gioi thieu)
  //appUserId la phan thuong xuat phat tu nguoi nay
  await reloadDailyMission(referUserId, appUserId);
  await updateUserMissionInfo(referUserId);
}

async function closeMission(appUserMissionHistoryId, forceClose = false) {
  Logger.info(`closeMission ${appUserMissionHistoryId}`);
  if (isNotValidValue(appUserMissionHistoryId)) {
    Logger.error(`closeMission ${appUserMissionHistoryId} isNotValidValue(appUserMissionHistoryId)`);
    return;
  }

  let _missionDetail = await AppUserMissionHistoryResourceAccess.findById(appUserMissionHistoryId);
  if (isNotValidValue(_missionDetail)) {
    Logger.error(`closeMission ${appUserMissionHistoryId} isNotValidValue(_missionDetail)`);
    return;
  }

  if (_missionDetail.missionStatus !== MISSION_STATUS.NEW && _missionDetail.missionStatus !== MISSION_STATUS.IN_PROGRESS) {
    Logger.error(`already closeMission ${appUserMissionHistoryId} _missionDetail.missionStatus ${_missionDetail.missionStatus}`);
    return;
  }
  let _missonPlayRecord = await fetchPlayRecordOfMission(appUserMissionHistoryId);
  if (forceClose === false && (!_missonPlayRecord || _missonPlayRecord.length < 2)) {
    Logger.error(`closeMission ${appUserMissionHistoryId} skip (_missonPlayRecord.length < 2)`);
    return;
  }

  if (
    forceClose === false &&
    (_missonPlayRecord[0].betRecordStatus !== BET_STATUS.COMPLETED || _missonPlayRecord[1].betRecordStatus !== BET_STATUS.COMPLETED)
  ) {
    Logger.info(
      `closeMission ${appUserMissionHistoryId} record not completed ${_missonPlayRecord[0].betRecordStatus} ${
        _missonPlayRecord[1].betRecordStatus !== BET_STATUS.COMPLETED
      }`,
    );
    return;
  }

  let _missionStatus = MISSION_STATUS.FAILED;
  if (_missonPlayRecord) {
    if (_missonPlayRecord[0] && _missonPlayRecord[0].betRecordResult === BET_RESULT.HOA) {
      _missonPlayRecord[0].betRecordResult = BET_RESULT.LOSE;
    }
    if (_missonPlayRecord[1] && _missonPlayRecord[1].betRecordResult === BET_RESULT.HOA) {
      _missonPlayRecord[1].betRecordResult = BET_RESULT.LOSE;
    }
    if (
      _missonPlayRecord[0] &&
      _missonPlayRecord[0].betRecordResult === BET_RESULT.WIN &&
      _missonPlayRecord[1] &&
      _missonPlayRecord[1].betRecordResult === BET_RESULT.WIN
    ) {
      _missionStatus = MISSION_STATUS.COMPLETED;
    } else if (
      _missonPlayRecord[0] &&
      _missonPlayRecord[0].betRecordResult === BET_RESULT.LOSE &&
      _missonPlayRecord[1] &&
      _missonPlayRecord[1].betRecordResult === BET_RESULT.WIN
    ) {
      if (forceClose) {
        _missionStatus = MISSION_STATUS.FAILED_HALF_1;
      } else {
        _missionStatus = MISSION_STATUS.WIN_HALF_1;
      }
    } else if (
      _missonPlayRecord[0] &&
      _missonPlayRecord[0].betRecordResult === BET_RESULT.WIN &&
      _missonPlayRecord[1] &&
      _missonPlayRecord[1].betRecordResult === BET_RESULT.LOSE
    ) {
      if (forceClose) {
        _missionStatus = MISSION_STATUS.FAILED_HALF_2;
      } else {
        _missionStatus = MISSION_STATUS.WIN_HALF_2;
      }
    }
  }

  let _systemConfig = await getSystemConfig();
  const _MISSION_BONUS_AMOUNT = _systemConfig.missionBonusAmount;
  const _MISION_BONUS_PERCENTAGE = _systemConfig.missionReferBonusPercentage;
  const _MISSION_BONUS_REFERAL_AMOUNT = (_MISION_BONUS_PERCENTAGE * _MISSION_BONUS_AMOUNT) / 100;
  const _MISSION_BONUS_HALF_AMOUNT = _systemConfig.missionBonusHalfAmount;

  let _currentPlayUser = await AppUsersResourceAccess.findById(_missionDetail.appUserId);
  let referUserId = _currentPlayUser.memberReferIdF1;

  let _userMissionInfo = await AppUserMissionInfoResourceAccess.findById(_missionDetail.appUserId);
  if (_missionStatus === MISSION_STATUS.COMPLETED) {
    let _referUser = await AppUsersResourceAccess.findById(referUserId);

    if (_referUser) {
      let _isQualified = await _isUserQualifiedToHaveMission(_referUser);
      if (_isQualified && forceClose === false) {
        //neu admin tat chuc nang nhan hoa hong nhiem vu thi ko tra hoa hong
        let _referUserMissionInfo = await AppUserMissionInfoResourceAccess.findById(_referUser.appUserId);
        if (_referUserMissionInfo && _referUserMissionInfo.enableAddMissionBonus) {
          //- Khi có f1 hoàn thành thành công 1 nv, thì người giới thiệu ra tk đó sẽ được tặng ngay tức thì 1 nv,
          //người giới thiệu chỉ hưởng tối đa 1 nv/1f1, dù f1 đó hoàn thành thành công bao nhiêu nv đi chăng nữa
          await addBonusMissionForReferUser(_missionDetail.appUserId, referUserId);

          //tương tự hoa hồng 10% cũng vậy, khi có F1 nào đó hoàn thành thành công 1 nv thì 1k nhảy ngay vào ví người giới thiệu
          await rewardMissionReferralBonus(referUserId, _MISSION_BONUS_REFERAL_AMOUNT, appUserMissionHistoryId);
        }
      }
    }

    if (_missionDetail.missionBonus < 1) {
      //neu admin tat chuc nang nhan hoa hong nhiem vu thi ko tra hoa hong
      if (_userMissionInfo && _userMissionInfo.enableAddMissionBonus) {
        //API > User hoàn thành nhiệm vụ thì cộng tiền vào ví chính 10 điểm
        //- Bonus sẽ cho nhảy tức thì, khi họ hoàn thành thành công 1 nv thì cho nhảy ngay 10k vào ví cá nhân,
        await rewardMissionBonus(_missionDetail.appUserId, _MISSION_BONUS_AMOUNT, appUserMissionHistoryId);
      }
    }

    await Promise.all([
      _completeMission(appUserMissionHistoryId, _missionDetail.appUserId, _MISSION_BONUS_AMOUNT, _MISSION_BONUS_REFERAL_AMOUNT, _missionStatus),
      _reduceRemainingMissionCount(_missionDetail.appUserId),
    ]);
  } else if (_missionStatus === MISSION_STATUS.WIN_HALF_1 || _missionStatus === MISSION_STATUS.WIN_HALF_2) {
    if (_missionDetail.missionBonus < 1) {
      //neu admin tat chuc nang nhan hoa hong nhiem vu thi ko tra hoa hong
      if (_userMissionInfo && _userMissionInfo.enableAddMissionBonus) {
        //API > User hoàn thành nhiệm vụ thì cộng tiền vào ví chính 10 điểm
        //- Bonus sẽ cho nhảy tức thì, khi họ hoàn thành thành công 1 nv thì cho nhảy ngay 3k (1/2 nhiem vu) vào ví cá nhân,
        await rewardMissionBonus(_missionDetail.appUserId, _MISSION_BONUS_HALF_AMOUNT, appUserMissionHistoryId);
      }
    }

    await Promise.all([
      _completeHalfMission(appUserMissionHistoryId, _missionDetail.appUserId, _MISSION_BONUS_HALF_AMOUNT, 0, _missionStatus),
      _reduceRemainingMissionCount(_missionDetail.appUserId),
    ]);
  } else {
    await Promise.all([_failureMission(appUserMissionHistoryId, _missionStatus), _updateMissionCompleteDate(_missionDetail.appUserId)]);
  }
  const { createMissionBonusRecordForUser } = require('../PaymentBonusTransaction/PaymentBonusTransactionFunctions');
  let _missionDay = '';
  if (_missionDetail.missionStartDay) {
    _missionDay = moment(_missionDetail.missionStartDay, MISSION_DAY_DATA_FORMAT).format(BONUS_PAYMENT_DATE_DB_FORMAT);
  } else {
    _missionDay = moment().format(BONUS_PAYMENT_DATE_DB_FORMAT);
  }

  if (isNotEmptyStringValue(_currentPlayUser.firstMissionAt) === false) {
    await updateFirstMissionAtForUser(_missionDetail.appUserId);
  }
  await Promise.all([updateUserMissionInfo(_missionDetail.appUserId)]);
  if (forceClose === false) {
    await Promise.all([
      createMissionBonusRecordForUser(_missionDetail.appUserId, _missionDay),
      createMissionBonusRecordForUser(referUserId, _missionDay),
    ]);
  }
  await _notifyMissionResult(_missionDetail);
}

async function _completeMission(appUserMissionHistoryId, appUserId, missionBonus, missionReferBonus) {
  await AppUserMissionHistoryResourceAccess.updateById(appUserMissionHistoryId, {
    missionCompletedDate: new Date(),
    missionStatus: MISSION_STATUS.COMPLETED,
    missionBonus: missionBonus || 0,
    missionReferBonus: missionReferBonus || 0,
  });
  //cong luot hoan thanh nhiem vu
  const appUserMission = await AppUserMissionInfoResourceAccess.findById(appUserId);
  if (appUserMission) {
    await AppUserMissionInfoResourceAccess.updateById(appUserId, {
      missionCompletedCount: appUserMission.missionCompletedCount + 1,
      lastUpdateMissionCompletedAt: new Date(),
      lastUpdateMissionCompletedAtTimestamp: new Date() * 1,
    });
  } else {
    await AppUserMissionInfoResourceAccess.insert({
      appUserId: appUserId,
      missionCompletedCount: 1,
      lastUpdateMissionCompletedAt: new Date(),
      lastUpdateMissionCompletedAtTimestamp: new Date() * 1,
    });
  }
}

async function _completeHalfMission(appUserMissionHistoryId, appUserId, missionBonus, missionReferBonus, missionStatus) {
  await AppUserMissionHistoryResourceAccess.updateById(appUserMissionHistoryId, {
    missionCompletedDate: new Date(),
    missionStatus: missionStatus,
    missionBonus: missionBonus || 0,
    missionReferBonus: missionReferBonus || 0,
  });
  //cong luot hoan thanh nhiem vu
  const appUserMission = await AppUserMissionInfoResourceAccess.findById(appUserId);
  if (appUserMission) {
    await AppUserMissionInfoResourceAccess.updateById(appUserId, {
      missionCompletedCount: appUserMission.missionCompletedCount + 1,
      lastUpdateMissionCompletedAt: new Date(),
      lastUpdateMissionCompletedAtTimestamp: new Date() * 1,
    });
  } else {
    await AppUserMissionInfoResourceAccess.insert({
      appUserId: appUserId,
      missionCompletedCount: 1,
      lastUpdateMissionCompletedAt: new Date(),
      lastUpdateMissionCompletedAtTimestamp: new Date() * 1,
    });
  }
}

async function _notifyMissionResult(mission) {
  publishJSONToClient(`MISSON_USER_${mission.appUserId}`, { mission: mission });
}

async function collectTotalSystemMissionBonusAmount(appUserId, startDate, endDate) {
  let _totalMissionBonusAmount = await AppUserMissionHistoryView.customSum('missionReferBonus', { memberReferIdF1: appUserId }, startDate, endDate);

  if (_totalMissionBonusAmount && _totalMissionBonusAmount.length > 0) {
    return _totalMissionBonusAmount[0].sumResult;
  }
  return 0;
}

async function collectTotalMissionBonusAmount(appUserId, startDate, endDate) {
  let _totalMissionBonusAmount = await AppUserMissionHistoryView.customSum('missionBonus', { appUserId: appUserId }, startDate, endDate);

  if (_totalMissionBonusAmount && _totalMissionBonusAmount.length > 0) {
    return _totalMissionBonusAmount[0].sumResult;
  }
  return 0;
}

//Dem so luong Nhà giao dịch cap duoi
async function collectTotalSystemUserPlayMission(appUserId, startDate, endDate) {
  let _totalSystemUserCount = 0;
  let _totalSystemUserCompletedMission = 0;
  let _counter = 0;
  let _limit = 20;
  let _distinctUserList = [];
  while (true) {
    let _systemUserPlayRecordList = await AppUserMissionHistoryView.customSearch(
      {
        memberReferIdF1: appUserId,
      },
      _counter,
      _limit,
      startDate,
      endDate,
    );

    if (_systemUserPlayRecordList && _systemUserPlayRecordList.length > 0) {
      for (let i = 0; i < _systemUserPlayRecordList.length; i++) {
        //khi nao thang moi duoc tinh
        if (
          _systemUserPlayRecordList[i].missionStatus === MISSION_STATUS.COMPLETED
          // || _systemUserPlayRecordList[i].missionStatus === MISSION_STATUS.WIN_HALF_1
          // || _systemUserPlayRecordList[i].missionStatus === MISSION_STATUS.WIN_HALF_2
          // || _systemUserPlayRecordList[i].missionStatus === MISSION_STATUS.FAILED
        ) {
          _totalSystemUserCompletedMission++;
        }

        //neu co choi la tinh
        if (
          _systemUserPlayRecordList[i].missionStatus !== MISSION_STATUS.NEW &&
          _systemUserPlayRecordList[i].missionStatus !== MISSION_STATUS.IN_PROGRESS
        ) {
          // _distinctUserList.push(_systemUserPlayRecordList[i].appUserId);
          if (_distinctUserList.indexOf(_systemUserPlayRecordList[i].appUserId) < 0) {
            _distinctUserList.push(_systemUserPlayRecordList[i].appUserId);
          }
        }
      }
      _counter += _limit;
    } else {
      break;
    }
  }

  _totalSystemUserCount = _distinctUserList.length;
  return {
    totalSystemUserCount: _totalSystemUserCount, //tong so user choi nhiem vu
    totalSystemUserCompletedMission: _totalSystemUserCompletedMission, //tong so nhiem vu da
  };
}

//So nhiem vu cua cap duoi
async function collectTotalSystemUserMissionInfo(appUserId) {
  let _totalSystemUserMissionCount = 0;
  let _counter = 0;
  let _limit = 20;
  while (true) {
    let _systemUserMissionInfoList = await AppUserMissionInfoView.customSearch({ memberReferIdF1: appUserId }, _counter, _limit);
    if (_systemUserMissionInfoList && _systemUserMissionInfoList.length > 0) {
      for (let i = 0; i < _systemUserMissionInfoList.length; i++) {
        _totalSystemUserMissionCount += _systemUserMissionInfoList[i].maxMissionCount;
      }
      _counter += _limit;
    } else {
      break;
    }
  }
  return _totalSystemUserMissionCount;
}

async function countCompletedMissionByUser(appUserId, startDate, endDate) {
  let _totalSystemUserCompletedMission = 0;
  let _counter = 0;
  let _limit = 20;
  while (true) {
    let _systemUserPlayRecordList = await AppUserMissionHistoryResourceAccess.customSearch(
      {
        appUserId: appUserId,
        missionStatus: MISSION_STATUS.COMPLETED,
      },
      _counter,
      _limit,
      startDate,
      endDate,
    );
    if (_systemUserPlayRecordList && _systemUserPlayRecordList.length > 0) {
      for (let i = 0; i < _systemUserPlayRecordList.length; i++) {
        if (_systemUserPlayRecordList[i].missionStatus !== MISSION_STATUS.NEW) {
          _totalSystemUserCompletedMission++;
        }
      }
      _counter += _limit;
    } else {
      break;
    }
  }
  return {
    totalUserCompletedMission: _totalSystemUserCompletedMission, //tong so nhiem vu da
  };
}

async function updateFirstMissionAtForUser(appUserId) {
  let _filter = {
    missionStatus: [
      MISSION_STATUS.COMPLETED,
      MISSION_STATUS.FAILED,
      MISSION_STATUS.FAILED_HALF_1,
      MISSION_STATUS.FAILED_HALF_2,
      MISSION_STATUS.WIN_HALF_1,
      MISSION_STATUS.WIN_HALF_2,
    ],
    appUserId: appUserId,
  };
  let _allTransaction = await AppUserMissionHistoryResourceAccess.customSearch(_filter, 0, 1, undefined, undefined, undefined, {
    key: 'createdAt',
    value: 'asc',
  });

  if (_allTransaction && _allTransaction.length > 0) {
    let _updateData = {};
    _updateData.firstMissionAt = _allTransaction[0].createdAt;
    _updateData.firstMissionAtTimestamp = moment(_allTransaction[0].createdAt, DATETIME_DATA_ISO_FORMAT).toDate() * 1;
    await AppUsersResourceAccess.updateById(appUserId, _updateData);
  }
}

module.exports = {
  addFirstMissionForUser,
  checkReadyToStartUserMission,
  updateFirstMissionAtForUser,
  updateMissionHistoryStatus,
  closeMission,
  collectTotalSystemUserPlayMission,
  collectTotalSystemUserMissionInfo,
  collectTotalMissionBonusAmount,
  collectTotalSystemMissionBonusAmount,
  countCompletedMissionByUser,
  resetUserDailyMissionInfo,
  reloadDailyMission,
  updateUserMissionInfo,
  fetchPlayRecordOfMission,
  getUserMissionInfo,
  startNewMission,
  getProcessingMissionOfUser,
};
