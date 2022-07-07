/**
 * Created by A on 7/18/17.
 */
"use strict";
const { WALLET_TYPE } = require("../WalletConstant");
const WalletFunction = require('../WalletFunctions');
const WalletRecordFunction = require('../../WalletRecord/WalletRecordFunction');
const UserResource = require("../../AppUsers/resourceAccess/AppUsersResourceAccess");

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};
async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve("success");
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
};


async function increaseBalance(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentAmount = req.payload.paymentAmount;
      let appUserId = req.payload.appUserId;
      let walletType = req.payload.walletType;

      let user = await UserResource.find({ appUserId: appUserId }, 0, 1);
      if (!user || user.length < 1) {
        reject("INVALID_USER");
        return;
      }
      user = user[0];
      //luu tru lai lich su bien dong so du cua Vi
      let result = await WalletRecordFunction.adminAdjustBalance(appUserId, paymentAmount, walletType, req.currentUser);

      if (result) {
        resolve(result);
      } else {
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
}

async function decreaseBalance(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentAmount = req.payload.paymentAmount;
      let appUserId = req.payload.appUserId;
      let walletType = req.payload.walletType;

      let user = await UserResource.find({ appUserId: appUserId }, 0, 1);
      if (!user || user.length < 1) {
        reject("INVALID_USER");
        return;
      }
      user = user[0];
      paymentAmount = paymentAmount * -1;
              
      //luu tru lai lich su bien dong so du cua Vi
      let result = await WalletRecordFunction.adminAdjustBalance(appUserId, paymentAmount, walletType, req.currentUser);

      if (result) {
        resolve(result);
      } else {
        reject("failed");
      }
    } catch (e) {
      console.error(e);
      reject("failed");
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  increaseBalance,
  decreaseBalance
};
