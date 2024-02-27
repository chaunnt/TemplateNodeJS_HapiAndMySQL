/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const MaintainFunctions = require('../MaintainFunctions');
const Logger = require('../../../utils/logging');
async function maintainAll(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainAll(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainDeposit(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainDeposit(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainLiveGame(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainLiveGame(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainWithdraw(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainWithdraw(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainSignup(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainSignup(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainSignup(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainSignup(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainSignIn(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainSignIn(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainChangePassword(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainChangePassword(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function maintainForgotPassword(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainForgotPassword(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function getSystemStatus(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(MaintainFunctions.getSystemStatus());
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
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
  getSystemStatus,
};
