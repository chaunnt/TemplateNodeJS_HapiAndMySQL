/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const MembershipResourceAccess = require('../resourceAccess/AppUserMembershipResourceAccess');
const Logger = require('../../../utils/logging');
const AppUserMembershipFunction = require('../AppUserMembershipFunction');
const { ERROR } = require('../../Common/CommonConstant');
async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      let result = await MembershipResourceAccess.insert(data);
      if (result) {
        resolve(result);
      }
      console.error(`error AppUserMembership can not insert: ${ERROR}`);
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      let data = await MembershipResourceAccess.customSearch(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        searchText,
        order,
      );
      let dataCount = await MembershipResourceAccess.customCount(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        searchText,
        order,
      );
      if (data && dataCount) {
        resolve({ data: data, total: dataCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await MembershipResourceAccess.findById(id);
      if (result) {
        resolve(result);
      }
      console.error(`error AppUserMembership can not findById with id ${id}: ${ERROR}`);
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;
      let result = await MembershipResourceAccess.updateById(id, data);
      if (result) {
        resolve(result);
      }
      console.error(`error AppUserMembership can not updateById with id ${id}: ${ERROR}`);
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await MembershipResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function userGetListMemberShip(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let result = await AppUserMembershipFunction.getListMemberShip(filter, skip, limit, order);
      if (result) {
        resolve(result);
      } else {
        return { data: result, total: 0 };
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
module.exports = {
  insert,
  find,
  findById,
  updateById,
  deleteById,
  userGetListMemberShip,
};
