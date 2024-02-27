/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationNewsResourceAccess = require('../resourceAccess/StationNewsResourceAccess');
const StationNewsCategoryViews = require('../resourceAccess/StationNewsCategoryViews');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const StationNewsNotificationJobAccess = require('../resourceAccess/StationNewsNotificationJobAccess');
const StationNewsCategoryResource = require('../../StationNewsCategory/resourceAccess/StationNewsCategoryResourceAccess');
const AppUserClickActivityAccess = require('../../AppUserClickActivity/resourceAccess/AppUserClickActivityAccess');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const Logger = require('../../../utils/logging');
const formatDate = require('../../ApiUtils/utilFunctions');
const StationsFunctions = require('../../Stations/StationsFunctions');
const { UNKNOWN_ERROR, POPULAR_ERROR, NOT_FOUND, MISSING_AUTHORITY } = require('../../Common/CommonConstant');
const { INVALID_MESSAGE, STATION_NEW_CATEGORIES } = require('../StationNewsConstants');
const { ACTIVITY_TYPE } = require('../../AppUserClickActivity/AppUserClickActivityConstant');
const { STATION_ADMIN_ROLE } = require('../../AppUserRole/AppUserRoleConstant');
const moment = require('moment');
let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsData = req.payload;
      stationNewsData.stationsId = req.currentUser.stationsId;
      let result = await StationNewsResourceAccess.insert(stationNewsData);

      if (result) {
        // refresh redis cache
        let filter = {};
        let skip = 0;
        let limit = 10;
        filter.isHidden = 0;
        let order = {
          key: 'stationNewsUpdatedAt',
          value: 'desc',
        };
        let stationNews = await StationNewsCategoryViews.find(filter, skip, limit, order);
        let _outputResponse = { data: [], total: 0 };
        if (stationNews && stationNews.length > 0) {
          _outputResponse = { data: stationNews, total: stationNews.length };
        }

        if (process.env.REDIS_ENABLE * 1 === 1) {
          const redisKey = `NEWEST_${JSON.stringify(filter)}_${skip}_${limit}_${JSON.stringify(order)}`;
          await RedisInstance.setWithExpire(redisKey, JSON.stringify(_outputResponse));
        }

        const shareLink = `${process.env.SHARE_HOST_NAME}/AppSharing/StationNews/${result[0]}`;
        await _notifyNewsToUser(stationNewsData.stationNewsTitle, shareLink);

        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserAddNews(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsData = req.payload;

      stationNewsData.stationsId = req.currentUser.stationsId;
      stationNewsData.stationNewsCreators = req.currentUser.appUserId;

      let result = await StationNewsResourceAccess.insert(stationNewsData);

      if (!result) {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _notifyNewsToUser(newsTitle, shareLink) {
  let notificationData = {
    notificationTitle: 'Có tin tức mới!',
    notificationContent: newsTitle,
    otherData: shareLink,
  };

  // Tạo thông bóa push để gửi đến tất cả người dùng
  await StationNewsNotificationJobAccess.insert(notificationData);
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let endDate = req.payload.endDate;
      let startDate = req.payload.startDate;
      if (startDate) {
        startDate = moment(startDate, 'DD/MM/YYYY').startOf('date').format();
      }
      if (endDate) {
        endDate = moment(endDate, 'DD/MM/YYYY').endOf('date').format();
      }
      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.stationsId = req.currentUser.stationsId;
      }
      let stationNews = await StationNewsCategoryViews.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      let stationNewsCount = await StationNewsCategoryViews.customCount(filter, startDate, endDate, searchText, order);
      if (stationNews && stationNewsCount) {
        resolve({ data: stationNews, total: stationNewsCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsId = req.payload.id;
      let stationNewsData = req.payload.data;
      let result = await StationNewsResourceAccess.updateById(stationNewsId, stationNewsData);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserUpdateNews(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      let stationNewsId = req.payload.id;
      let stationNewsData = req.payload.data;

      const existedNew = await StationNewsResourceAccess.findById(stationNewsId);
      if (!existedNew) {
        return reject(NOT_FOUND);
      }

      // Không phải tin tức do nhân viên trạm tạo
      if (currentUser.stationsId !== existedNew.stationsId) {
        return reject(MISSING_AUTHORITY);
      }

      // Không phải là giám đốc
      // Tin tức không do current user tạo
      // => không được phép update
      if (currentUser.appUserRoleId !== STATION_ADMIN_ROLE && currentUser.appUserId !== existedNew.stationNewsCreators) {
        return reject(MISSING_AUTHORITY);
      }

      let result = await StationNewsResourceAccess.updateById(stationNewsId, stationNewsData);
      if (!result) {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }

      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserDeleteNew(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      let stationNewsId = req.payload.id;

      const existedNew = await StationNewsResourceAccess.findById(stationNewsId);
      if (!existedNew) {
        return reject(NOT_FOUND);
      }

      // Không phải tin tức do nhân viên trạm tạo
      if (currentUser.stationsId !== existedNew.stationsId) {
        return reject(MISSING_AUTHORITY);
      }

      // Không phải là giám đốc
      // Tin tức không do current user tạo
      // => không được phép xóa
      if (currentUser.appUserRoleId !== STATION_ADMIN_ROLE && currentUser.appUserId !== existedNew.stationNewsCreators) {
        return reject(MISSING_AUTHORITY);
      }

      let result = await StationNewsResourceAccess.deleteById(stationNewsId);
      if (!result) {
        return reject(POPULAR_ERROR.DELETE_FAILED);
      }

      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsId = req.payload.id;
      let result = await StationNewsCategoryViews.findById(stationNewsId);
      if (result) {
        await _increaseView(stationNewsId, result.totalViewed);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

let CACHE_VIEWS_COUNTER = {};
let needToUpdateViewCount = false;

let CACHE_SHARE_COUNTER = {};
let needToUpdateShareCount = false;

let CACHE_SHARE_CLICK_COUNTER = {};
let needToSaveClickShareCount = false;

//1 giờ 1 lần sẽ cập nhật lượt view vào database
setInterval(async () => {
  if (needToUpdateViewCount) {
    needToUpdateViewCount = false;
    for (let i = 0; i < Object.keys(CACHE_VIEWS_COUNTER).length; i++) {
      const _key = Object.keys(CACHE_VIEWS_COUNTER)[i];
      if (CACHE_VIEWS_COUNTER[_key] && CACHE_VIEWS_COUNTER[_key] * 1 > 0) {
        await StationNewsResourceAccess.updateById(_key, { totalViewed: CACHE_VIEWS_COUNTER[_key] });
      }
    }
  }

  if (needToUpdateShareCount) {
    needToUpdateShareCount = false;
    for (let i = 0; i < Object.keys(CACHE_SHARE_COUNTER).length; i++) {
      const _key = Object.keys(CACHE_SHARE_COUNTER)[i];
      if (CACHE_SHARE_COUNTER[_key] && CACHE_SHARE_COUNTER[_key] * 1 > 0) {
        await StationNewsResourceAccess.updateById(_key, { followCount: CACHE_SHARE_COUNTER[_key] });
      }
    }
  }

  if (needToSaveClickShareCount) {
    needToSaveClickShareCount = false;
    for (let i = 0; i < Object.keys(CACHE_SHARE_CLICK_COUNTER).length; i++) {
      const _key = Object.keys(CACHE_SHARE_CLICK_COUNTER)[i];

      const keySegments = _key.split('_');
      const targetId = keySegments[0];
      const appUserId = keySegments[1] === 'null' ? null : keySegments[1];

      if (CACHE_SHARE_CLICK_COUNTER[_key] && CACHE_SHARE_CLICK_COUNTER[_key] * 1 > 0) {
        await AppUserClickActivityAccess.insert({
          appUserId: appUserId,
          targetId: targetId,
          totalClick: CACHE_SHARE_CLICK_COUNTER[_key],
          activityType: ACTIVITY_TYPE.SHARE_NEWS,
        });
      }
    }
    CACHE_SHARE_CLICK_COUNTER = {};
  }
}, 1000 * 30);

async function _increaseView(id, previousView) {
  if (CACHE_VIEWS_COUNTER[id]) {
    CACHE_VIEWS_COUNTER[id] += formatDate.randomIntByMinMax(1, 99);
  } else {
    CACHE_VIEWS_COUNTER[id] = 0;
    const viewCount = previousView ? ++previousView : 1;
    CACHE_VIEWS_COUNTER[id] += viewCount;
  }
  needToUpdateViewCount = true;
}

async function _saveShareCountNewsClicks(id, appUserId) {
  const key = id + '_' + appUserId;

  if (CACHE_SHARE_CLICK_COUNTER[key]) {
    CACHE_SHARE_CLICK_COUNTER[key] += 1;
  } else {
    CACHE_SHARE_CLICK_COUNTER[key] = 0;
    CACHE_SHARE_CLICK_COUNTER[key] += 1;
  }
  needToSaveClickShareCount = true;
}

async function increaseShare(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = null;
      const currentUser = req.currentUser;
      if (currentUser) {
        appUserId = currentUser.appUserId;
      }

      let stationNewsId = req.payload.stationNewsId;
      let result = await StationNewsCategoryViews.findById(stationNewsId);
      if (result) {
        if (CACHE_SHARE_COUNTER[stationNewsId]) {
          CACHE_SHARE_COUNTER[stationNewsId] += 1;
        } else {
          CACHE_SHARE_COUNTER[stationNewsId] = 0;
          const viewCount = result.followCount ? ++result.followCount : 1;
          CACHE_SHARE_COUNTER[stationNewsId] += viewCount;
        }
        needToUpdateShareCount = true;

        _saveShareCountNewsClicks(stationNewsId, appUserId);

        resolve('success');
      } else {
        reject(INVALID_MESSAGE);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
let swapper = 0;
async function getNewsDetail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsId = req.payload.id;
      let result = await StationNewsCategoryViews.findById(stationNewsId);
      if (result) {
        await _increaseView(stationNewsId, result.totalViewed);
        swapper++;
        if (swapper > 10) {
          swapper = 0;
        }
        let _relatedNews = [];
        if (swapper === 0) {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5, {
            key: 'totalViewed',
            value: 'desc',
          });
        } else if (swapper < 5) {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5, {
            key: 'monthViewed',
            value: 'desc',
          });
        } else if (swapper < 8) {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5, {
            key: 'weekViewed',
            value: 'desc',
          });
        } else {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5);
        }
        result.relatedNews = _relatedNews;
        result.shareLink = `${process.env.SHARE_HOST_NAME}/AppSharing/StationNews/${stationNewsId}`;
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getNewList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationsUrl = req.payload.stationsUrl;
      let filter = req.payload.filter;
      if (!filter) {
        filter = {};
      }

      let _outputResponse = { data: [], total: 0 };
      let station = await StationsFunctions.getStationDetailByUrl(stationsUrl);
      if (station) {
        filter = {
          ...filter,
          stationsId: station.stationsId,
        };

        // load data from redis
        if (process.env.REDIS_ENABLE * 1 === 1) {
          const redisKey = `HOT_NEWS_${JSON.stringify(filter)}_${skip}_${limit}`;
          const cacheData = await RedisInstance.getJson(redisKey);
          if (cacheData) {
            return resolve(cacheData);
          }
        }
        let stationNews = await StationNewsCategoryViews.find(filter, skip, limit);

        if (stationNews && stationNews.length > 0) {
          let stationNewsCount = await StationNewsCategoryViews.count(filter);
          _outputResponse = { data: stationNews, total: stationNewsCount };
        }

        // cache data
        if (process.env.REDIS_ENABLE * 1 === 1) {
          const redisKey = `HOT_NEWS_${JSON.stringify(filter)}_${skip}_${limit}`;
          await RedisInstance.setWithExpire(redisKey, JSON.stringify(_outputResponse));
        }
      }

      resolve(_outputResponse);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = req.currentUser;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = req.payload.filter || {};

      //Chỉ lấy danh sách các tin tức do trạm tạo
      filter.stationsId = currentUser.stationsId;

      // Nếu không phải là giám đốc thì chỉ lấy được danh sách tin tức do mình tạo
      if (currentUser.appUserRoleId !== STATION_ADMIN_ROLE) {
        filter.stationNewsCreators = currentUser.appUserId;
      }

      let _outputResponse = { data: [], total: 0 };

      // load data from redis
      if (process.env.REDIS_ENABLE * 1 === 1) {
        const redisKey = `STAION_NEWS_${JSON.stringify(filter)}_${skip}_${limit}`;
        const cacheData = await RedisInstance.getJson(redisKey);
        if (cacheData) {
          return resolve(cacheData);
        }
      }

      let stationNews = await StationNewsCategoryViews.find(filter, skip, limit);

      if (stationNews && stationNews.length > 0) {
        let stationNewsCount = await StationNewsCategoryViews.count(filter);
        await _attacthInfoCreatorAndInfoStation(stationNews);
        _outputResponse = { data: stationNews, total: stationNewsCount };
      }

      if (process.env.REDIS_ENABLE * 1 === 1) {
        const redisKey = `STAION_NEWS_${JSON.stringify(filter)}_${skip}_${limit}`;
        await RedisInstance.setWithExpire(redisKey, JSON.stringify(_outputResponse));
      }

      resolve(_outputResponse);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getAllNewsForStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationUrl = req.payload.stationsUrl;
      let station = await StationsResourceAccess.find({ stationUrl: stationUrl }, 0, 1);

      let outputResult = {
        generalNews: {
          data: [],
          total: 0,
        },
        mostReadNews: [],
        categoriesNews: [],
      };

      //retry to find config with
      if (!station || station.length <= 0) {
        const DEFAULT_URL = 'ttdk.com.vn';
        station = await StationsResourceAccess.find({ stationUrl: DEFAULT_URL }, 0, 1);
      }

      //retry to find config with
      if (!station || station.length <= 0) {
        station = await StationsResourceAccess.find({ stationLandingPageUrl: stationUrl }, 0, 1);
      }

      if (station && station.length > 0) {
        // load data from redis
        if (process.env.REDIS_ENABLE * 1 === 1) {
          const redisKey = `NEWS_LIST_${stationUrl}`;
          const cacheData = await RedisInstance.getJson(redisKey);
          if (cacheData) {
            return resolve(cacheData);
          }
        }

        let _allCategories = await StationNewsCategoryResource.find({ stationsId: station[0].stationsId }, 0, 20, {
          key: 'stationNewsCategoryDisplayIndex',
          value: 'asc',
        });

        if (_allCategories && _allCategories.length > 0) {
          outputResult.categoriesList = _allCategories;
          for (let i = 0; i < _allCategories.length; i++) {
            let _stationNews = await StationNewsCategoryViews.find(
              {
                stationsId: station[0].stationsId,
                stationNewsCategories: _allCategories[i].stationNewsCategoryId,
              },
              skip,
              limit,
            );
            let _stationNewsCount = await StationNewsCategoryViews.count({
              stationsId: station[0].stationsId,
              stationNewsCategories: _allCategories[i].stationNewsCategoryId,
            });
            _allCategories[i].data = _stationNews ? _stationNews : [];
            _allCategories[i].total = _stationNewsCount ? _stationNewsCount : 0;
          }
        }

        outputResult.categoriesNews = _allCategories;

        let stationNews = await StationNewsCategoryViews.find({ stationsId: station[0].stationsId }, skip, limit);
        let stationNewsCount = await StationNewsCategoryViews.count({ stationsId: station[0].stationsId });
        if (stationNews && stationNewsCount) {
          let _mostReadNews = await StationNewsCategoryViews.find({ stationsId: station[0].stationsId }, skip, limit, {
            key: 'totalViewed',
            value: 'desc',
          });

          let generalNews = {
            data: stationNews,
            total: stationNewsCount,
          };

          outputResult.generalNews = generalNews;
          outputResult.mostReadNews = _mostReadNews;
        }

        // cache data
        if (process.env.REDIS_ENABLE * 1 === 1) {
          const redisKey = `NEWS_LIST_${stationUrl}`;
          const stationNewsJson = JSON.stringify(outputResult);
          await RedisInstance.setWithExpire(redisKey, stationNewsJson, 3 * 60 * 60);
        }

        resolve(outputResult);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsId = req.payload.id;

      let result = await StationNewsResourceAccess.deleteById(stationNewsId);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getHotNewList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationUrl = req.payload.stationsUrl;
      let station = await StationsResourceAccess.find({ stationUrl: stationUrl });
      let order = {
        key: 'totalViewed',
        value: 'desc',
      };
      if (station && station.length > 0) {
        let stationNews = await StationNewsCategoryViews.find({ stationsId: station[0].stationsId }, skip, limit, order);
        let stationNewsCount = await StationNewsCategoryViews.count({ stationsId: station[0].stationsId });
        if (stationNews && stationNewsCount) {
          resolve({ data: stationNews, total: stationNewsCount });
        } else {
          resolve({ data: [], total: 0 });
        }
      }
      reject('failed');
    } catch {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _getListStationNews(filter, skip, limit, order) {
  if (!order) {
    order = {
      key: 'stationNewsUpdatedAt',
      value: 'desc',
    };
  }

  //Chỉ lấy những tin tức không bị ẩn
  filter.isHidden = 0;

  let _outputResponse = { data: [], total: 0 };

  // load data from redis
  if (process.env.REDIS_ENABLE * 1 === 1) {
    const redisKey = `NEWEST_${JSON.stringify(filter)}_${skip}_${limit}_${JSON.stringify(order)}`;
    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      return cacheData;
    }
  }

  let stationNews = await StationNewsCategoryViews.find(filter, skip, limit, order);

  if (stationNews && stationNews.length > 0) {
    let totalNews = await StationNewsCategoryViews.customCount(filter);

    await _attacthInfoCreatorAndInfoStation(stationNews);

    _outputResponse = { data: stationNews, total: totalNews };
  }

  // cache data
  if (process.env.REDIS_ENABLE * 1 === 1) {
    const redisKey = `NEWEST_${JSON.stringify(filter)}_${skip}_${limit}_${JSON.stringify(order)}`;
    await RedisInstance.setWithExpire(redisKey, JSON.stringify(_outputResponse));
  }

  return _outputResponse;
}

async function getNewestList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationsUrl = req.payload.stationsUrl;
      let filter = req.payload.filter || {};
      let order = req.payload.order;

      filter.stationNewsCategories = STATION_NEW_CATEGORIES.GENERAL_NEWS; // Chỉ lấy phần tin tức chung

      const listNews = await _getListStationNews(filter, skip, limit, order);

      resolve(listNews);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _attacthInfoCreatorAndInfoStation(listNews) {
  for (let news of listNews) {
    const appUsserId = news.stationNewsCreators;
    const stationId = news.stationsId;
    const creator = await AppUsersResourceAccess.findById(appUsserId);
    const station = await StationsResourceAccess.findById(stationId);

    if (creator) {
      news.stationNewsCreators = {
        appUserId: creator.appUserId,
        firstName: creator.firstName,
      };
    } else {
      news.stationNewsCreators = null;
    }

    if (station) {
      news.stationId = {
        stationsId: station.stationsId,
        stationsName: station.stationsName,
        stationsLogo: station.stationsLogo,
      };
    } else {
      news.stationId = null;
    }
  }
}

async function getExpertNews(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = {};
      let order = req.payload.order;

      filter.stationNewsCategories = STATION_NEW_CATEGORIES.EXPERT_NEWS; // Chỉ lấy phần tin tức "Chuyên gia chia sẻ"

      const listNews = await _getListStationNews(filter, skip, limit, order);

      resolve(listNews);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getRecruitmentNews(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = {};
      let order = req.payload.order;

      filter.stationNewsCategories = STATION_NEW_CATEGORIES.RECRUITMENT_NEWS; // Chỉ lấy phần tin tức "Tin tức tuyển dụng"

      const listNews = await _getListStationNews(filter, skip, limit, order);

      resolve(listNews);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getHighLightNews(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = {};
      let order = req.payload.order;

      filter.stationNewsCategories = STATION_NEW_CATEGORIES.HIGHLIGHT_NEWS; // Chỉ lấy phần tin tức "Tin tức nổi bật"

      const listNews = await _getListStationNews(filter, skip, limit, order);

      resolve(listNews);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getPartnerPromotionNews(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = {};
      let order = req.payload.order;

      filter.stationNewsCategories = STATION_NEW_CATEGORIES.PARTNER_PROMOTION_NEWS; // Chỉ lấy phần tin tức "Tin tức nổi bật"

      const listNews = await _getListStationNews(filter, skip, limit, order);

      resolve(listNews);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getPartnerUtilityNews(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let filter = {};
      let order = req.payload.order;

      filter.stationNewsCategories = STATION_NEW_CATEGORIES.PARTNER_UTILITY_NEWS; // Chỉ lấy phần tin tức "Tin tức nổi bật"

      const listNews = await _getListStationNews(filter, skip, limit, order);

      resolve(listNews);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  getNewsDetail,
  getNewList,
  deleteById,
  getHotNewList,
  getAllNewsForStation,
  getNewestList,
  increaseShare,
  getExpertNews,
  getRecruitmentNews,
  getHighLightNews,
  advanceUserAddNews,
  advanceUserGetList,
  advanceUserUpdateNews,
  advanceUserDeleteNew,
  getPartnerPromotionNews,
  getPartnerUtilityNews,
};
