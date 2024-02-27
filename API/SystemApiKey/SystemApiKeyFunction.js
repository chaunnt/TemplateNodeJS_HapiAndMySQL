/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const SystemApiKeyResourceAccess = require('./resourceAccess/SystemApiKeyResourceAccess');
const { SETTING, APIKEY_EXISTED } = require('./SystemApiKeyConstants');
const uuid = require('uuid');
const UtilsFunction = require('../ApiUtils/utilFunctions');

let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../ThirdParty/Redis/RedisInstance');
}

function generateRandomApiKey() {
  let apiKey = uuid.v4();

  return apiKey;
}

async function createNewApiKey(apikeyData) {
  apikeyData.callCount = 0;
  apikeyData.apiKeyEnable = SETTING.DISABLE;
  apikeyData.apiKey = generateRandomApiKey();

  // Nếu tạo apikey cho trạm thì kiểm tra trạm đã có apikey chưa
  if (apikeyData.stationsId) {
    const apikeyExisted = await SystemApiKeyResourceAccess.find({ stationsId: apikeyData.stationsId }, 0, 1);
    if (apikeyExisted && apikeyExisted.length > 0) return null;
  }

  // Tạo mới apikey
  const apikeyId = await SystemApiKeyResourceAccess.insert(apikeyData);

  return apikeyId;
}

async function findByKey(apiKey) {
  // Lấy data từ redis
  if (process.env.REDIS_ENABLE * 1 === 1) {
    const redisKey = `APIKEY_${apiKey}`;
    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      return cacheData;
    }
  }

  let result = await SystemApiKeyResourceAccess.findById(apiKey);

  //Lưu lại data mới cho redis
  if (process.env.REDIS_ENABLE * 1 === 1 && result) {
    const redisKey = `APIKEY_${apiKey}`;
    await RedisInstance.setWithExpire(redisKey, JSON.stringify(result));
  }

  return result;
}

// Kiểm tra apikey không hợp lệ (không trùng khớp || bị tắt)
async function checkValidApiKey(apiKey) {
  // apikey không được null hoặc rỗng
  if (!UtilsFunction.isNotEmptyStringValue(apiKey)) {
    return undefined;
  }

  const apiKeyExisted = await findByKey(apiKey);

  // apikey không hợp lệ - không có trong hệ thống
  if (!apiKeyExisted) {
    return undefined;
  }

  // Tăng số lượt gọi apikey của đối tác
  await _increaseCallApiKey(apiKeyExisted.apiKey, apiKeyExisted.callCount);

  // apikey không hợp lệ - đã bị tắt (không được sử dụng)
  if (apiKeyExisted.apiKeyEnable === SETTING.DISABLE) {
    return undefined;
  }

  return apiKeyExisted;
}

// Tính số lượt gọi apikey của đối tác
let CACHE_CALL_APIKEY_COUNTER = {};
let needToUpdateCallApiKeyCount = false;

//1 giờ 1 lần sẽ cập nhật lượt gọi apikey
setInterval(async () => {
  if (needToUpdateCallApiKeyCount) {
    needToUpdateCallApiKeyCount = false;
    for (let i = 0; i < Object.keys(CACHE_CALL_APIKEY_COUNTER).length; i++) {
      const _key = Object.keys(CACHE_CALL_APIKEY_COUNTER)[i];
      if (CACHE_CALL_APIKEY_COUNTER[_key] && CACHE_CALL_APIKEY_COUNTER[_key] * 1 > 0) {
        await SystemApiKeyResourceAccess.updateById(_key, { callCount: CACHE_CALL_APIKEY_COUNTER[_key] });
      }
    }
  }
}, 1000 * 30);

async function _increaseCallApiKey(apikey, previousCallCount) {
  const key = apikey;

  if (CACHE_CALL_APIKEY_COUNTER[key]) {
    CACHE_CALL_APIKEY_COUNTER[key] += 1;
  } else {
    CACHE_CALL_APIKEY_COUNTER[key] = 0;
    const callCount = previousCallCount ? ++previousCallCount : 1;
    CACHE_CALL_APIKEY_COUNTER[key] += callCount;
  }
  needToUpdateCallApiKeyCount = true;
}

module.exports = {
  createNewApiKey,
  checkValidApiKey,
  findByKey,
};
