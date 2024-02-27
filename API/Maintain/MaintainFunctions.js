/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const Logger = require('../../utils/logging');
const { SYSTEM_STATUS } = require('./MaintainConstant');
const SystemConfigurationsResourceAccess = require('../SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
const { isNotEmptyStringValue } = require('../ApiUtils/utilFunctions');

let _systemStatus = JSON.parse(JSON.stringify(SYSTEM_STATUS));

async function initMaintainConfig() {
  Logger.info(`initMaintainConfig ${new Date()}`);
  let config = await SystemConfigurationsResourceAccess.find({}, 0, 1);
  if (config && config.length > 0) {
    config = config[0];

    if (isNotEmptyStringValue(config.maintainConfig)) _systemStatus = JSON.parse(config.maintainConfig);
    return config;
  }
  return undefined;
}

setTimeout(() => {
  initMaintainConfig();
}, 3000);

async function _updateSystemConfigToDb() {
  await SystemConfigurationsResourceAccess.updateById(1, {
    maintainConfig: JSON.stringify(_systemStatus),
  });
}

//Maintain button for		ALL WEB
async function maintainAll(enable) {
  Logger.info('Maintain', _systemStatus);
  if (enable === true) {
    _systemStatus.all = true;
  } else {
    _systemStatus.all = false;
  }
  await _updateSystemConfigToDb();
}

//Maintain button for		Live Game
async function maintainLiveGame(enable) {
  if (enable === true) {
    _systemStatus.liveGame = true;
  } else {
    _systemStatus.liveGame = false;
  }
  Logger.info('Maintain', _systemStatus);
  await _updateSystemConfigToDb();
}

//Maintain button for		Deposit
async function maintainDeposit(enable) {
  if (enable === true) {
    _systemStatus.deposit = true;
  } else {
    _systemStatus.deposit = false;
  }
  Logger.info('Maintain', _systemStatus);
  await _updateSystemConfigToDb();
}

//Maintain button for		Withdraw
async function maintainWithdraw(enable) {
  if (enable === true) {
    _systemStatus.withdraw = true;
  } else {
    _systemStatus.withdraw = false;
  }
  Logger.info('Maintain', _systemStatus);
  await _updateSystemConfigToDb();
}

//Maintain button for		Signup New USER
async function maintainSignup(enable) {
  if (enable === true) {
    _systemStatus.signup = true;
  } else {
    _systemStatus.signup = false;
  }
  Logger.info('Maintain', _systemStatus);
  await _updateSystemConfigToDb();
}

//Maintain button for Signin
async function maintainSignIn(enable) {
  if (enable === true) {
    _systemStatus.signin = true;
  } else {
    _systemStatus.signin = false;
  }
  Logger.info('Maintain', _systemStatus);
  await _updateSystemConfigToDb();
}

//Maintain button for ChangePassword
async function maintainChangePassword(enable) {
  if (enable === true) {
    _systemStatus.changePassword = true;
  } else {
    _systemStatus.changePassword = false;
  }
  Logger.info('Maintain', _systemStatus);
  await _updateSystemConfigToDb();
}

//Maintain button for ForgotPassword
async function maintainForgotPassword(enable) {
  if (enable === true) {
    _systemStatus.forgotPassword = true;
  } else {
    _systemStatus.forgotPassword = false;
  }
  Logger.info('Maintain', _systemStatus);
  await _updateSystemConfigToDb();
}

async function maintainWarningMessage(message) {
  _systemStatus.maintainMessage = message;
  await _updateSystemConfigToDb();
}

function getSystemStatus() {
  return _systemStatus;
}
module.exports = {
  maintainAll,
  maintainDeposit,
  maintainLiveGame,
  maintainWithdraw,
  maintainSignup,
  maintainSignIn,
  maintainChangePassword,
  maintainForgotPassword,
  maintainWarningMessage,
  getSystemStatus,
};
