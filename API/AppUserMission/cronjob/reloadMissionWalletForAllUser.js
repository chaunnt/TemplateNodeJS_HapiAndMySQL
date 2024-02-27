/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */

const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const WalletResourceAccess = require('../../Wallet/resourceAccess/WalletResourceAccess');
const AppUserMissionInfoResourceAccess = require('../../AppUserMission/resourceAccess/AppUserMissionInfoResourceAccess');
const Logger = require('../../../utils/logging');

async function reloadMissionWalletForUser(appUserId) {
  let _existingMission = await AppUserMissionInfoResourceAccess.findById(appUserId);
  if (_existingMission && _existingMission.maxMissionCount > 0) {
    let _walletList = await WalletResourceAccess.find({
      appUserId: appUserId,
      walletType: WALLET_TYPE.MISSION,
    });
    if (_walletList && _walletList.length > 0) {
      for (let i = 0; i < _walletList.length; i++) {
        _walletList[i].balance = 100000000;
      }
      await WalletResourceAccess.updateBalanceTransaction(_walletList);
    }
  }
}
async function reloadMissionWalletForAllUser() {
  Logger.info(`START to reloadMissionWalletForAllUser ${new Date()}`);
  let limit = 100;
  let skip = 0;

  while (true) {
    let _missionUserList = await AppUserMissionInfoResourceAccess.find({}, skip, limit);

    if (_missionUserList && _missionUserList.length > 0) {
      let promiseList = [];
      for (let i = 0; i < _missionUserList.length; i++) {
        promiseList.push(reloadMissionWalletForUser(_missionUserList[i].appUserId));
      }
      await Promise.all(promiseList);
      skip += limit;
    } else {
      break;
    }
  }
  Logger.info(`FINISH to reloadMissionWalletForAllUser ${new Date()}`);
}

module.exports = {
  reloadMissionWalletForAllUser,
};
