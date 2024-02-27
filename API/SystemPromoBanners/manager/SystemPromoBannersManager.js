/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const Logger = require('../../../utils/logging');
const SystemPromoBannersResourceAccess = require('../resourceAccess/SystemPromoBannersResourceAccess');
const moment = require('moment');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { BANNER_SECTION, BANNER_ERROR } = require('../SystemPromoBannersConstants');
const { DATE_DB_SORT_FORMAT } = require('../../Common/CommonConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let bannerData = req.payload;

      let result = await SystemPromoBannersResourceAccess.insert(bannerData);

      if (result) {
        return resolve(result);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (error) {
      Logger.error('insert system banner error', error);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return await _find(req);
}

async function userGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      // Chỉ lấy những banner chưa đến ngày hết hạn
      let startDate = moment().format(DATE_DB_SORT_FORMAT) * 1;

      let bannerList = await SystemPromoBannersResourceAccess.customSearch(filter, skip, limit, startDate, undefined, undefined, order);

      if (bannerList) {
        resolve({ data: bannerList, count: bannerList.length });
      } else {
        resolve({ data: [], count: 0 });
      }
    } catch (error) {
      Logger.error('find system banner error', error);
      reject('failed');
    }
  });
}
async function _find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      let bannerList = await SystemPromoBannersResourceAccess.find(filter, skip, limit, order);

      if (bannerList) {
        let count = await SystemPromoBannersResourceAccess.count(filter, order);
        resolve({ data: bannerList, count: count });
      } else {
        resolve({ data: [], count: 0 });
      }
    } catch (error) {
      Logger.error('find system banner error', error);
      reject('failed');
    }
  });
}

async function userGetDetailById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      if (!data.id) {
        return reject(BANNER_ERROR.INVALID_BANNER_ID);
      }
      let bannerDetail = await SystemPromoBannersResourceAccess.findById(data.id);
      if (bannerDetail) {
        let curentDate = moment().format(DATE_DB_SORT_FORMAT) * 1;
        if (bannerDetail.bannerExpirationDate < curentDate) {
          return reject(BANNER_ERROR.NOT_FOUND);
        }
        return resolve(bannerDetail);
      } else {
        return reject(BANNER_ERROR.NOT_FOUND);
      }
    } catch (error) {
      Logger.error('find system banner detail error', error);
      reject('failed');
    }
  });
}

async function findById(req) {
  return await _findDetailById(req);
}
async function _findDetailById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      if (!data.id) {
        return reject(BANNER_ERROR.INVALID_BANNER_ID);
      }
      let bannerDetail = await SystemPromoBannersResourceAccess.findById(data.id);
      if (bannerDetail) {
        return resolve(bannerDetail);
      } else {
        return reject(BANNER_ERROR.NOT_FOUND);
      }
    } catch (error) {
      Logger.error('find system banner detail error', error);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;
      let updateResult = await SystemPromoBannersResourceAccess.updateById(id, data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject(BANNER_ERROR.UPDATE_FAILED);
      }
    } catch (error) {
      Logger.error('update banner detail error', error);
      reject(BANNER_ERROR.UPDATE_FAILED);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await SystemPromoBannersResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject(BANNER_ERROR.DELETE_FAILED);
      }
    } catch (error) {
      Logger.error('delete banner detail error', error);
      reject(BANNER_ERROR.DELETE_FAILED);
    }
  });
}

module.exports = {
  insert,
  findById,
  find,
  updateById,
  deleteById,
  userGetList,
  userGetDetailById,
};
