/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const RoleResourceAccess = require('../resourceAccess/RoleResourceAccess');
const Logger = require('../../../utils/logging');
const { ERROR } = require('../../Common/CommonConstant');
async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let roleData = req.payload;
      let result = await RoleResourceAccess.insert(roleData);
      if (result) {
        resolve(result);
      }
      console.error(`error Role can not insert: ${ERROR}`);
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

      let roles = await RoleResourceAccess.customSearch(filter, skip, limit, undefined, undefined, undefined, order);
      let rolesCount = await RoleResourceAccess.customCount(
        filter,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        order,
      );
      if (roles && rolesCount) {
        resolve({ data: roles, total: rolesCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let roleId = req.payload.id;
      let roleData = req.payload.data;
      let result = await RoleResourceAccess.updateById(roleId, roleData);
      if (result) {
        resolve(result);
      }
      console.error(`error Role updateById with roleId ${roleId}: ${ERROR}`);
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
};
