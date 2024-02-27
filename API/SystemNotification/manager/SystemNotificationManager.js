/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const Logger = require('../../../utils/logging');
const SystemNotificationResourceAccess = require('../resourceAccess/SystemNotificationResourceAccess');
const moment = require('moment');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { NOTIFICATION_ACTION_STATUS } = require('../SystemNotificationConstants');

async function insert(req) {
  return await _createNotification(req);
}

async function robotInsert(req) {
  return await _createNotification(req);
}

async function _createNotification(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _newSMSData = {
        ...req.payload,
        notificationSendTime: moment().format('HH:mm'),
        notificationSendDate: moment().format('YYYYMMDD'),
        staffId: req.currentUser.staffId,
      };

      // store informations from message
      let result = await SystemNotificationResourceAccess.insert(_newSMSData);

      if (result) {
        _notifyNewsToUser(req.payload.notificationContent);
        resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (error) {
      Logger.error('insert system notification error', error);
      reject(UNKNOWN_ERROR);
    }
  });
}
async function _notifyNewsToUser(newsNotification) {
  const FirebaseNotificationFunctions = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');

  const title = 'Có thông báo mới!';
  const message = newsNotification;
  const result = await FirebaseNotificationFunctions.pushNotificationByTopic('GENERAL', title, message, undefined, 'GENERAL');
  Logger.info('PUSH STATION NEWS NOTIFICATION RESULT =>', result);
}
async function find(req) {
  return await _find(req);
}

async function getList(req) {
  return await _find(req);
}

async function _find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      startDate = moment(startDate, 'DD/MM/YYYY').startOf('day').toISOString();
      endDate = moment(endDate, 'DD/MM/YYYY').endOf('day').toISOString();
      let notificationList = await SystemNotificationResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (notificationList) {
        let count = await SystemNotificationResourceAccess.customCount(filter, startDate, endDate, searchText);
        resolve({ data: notificationList, count: count[0].count });

        // Cập nhật lượt xem thông báo khi user xem dan sách thông báo
        await _increaseViewForListSysNoti(notificationList);
      } else {
        resolve({ data: [], count: 0 });
      }
    } catch (error) {
      Logger.error('find system notification error', error);
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
        reject('INVALID_SMS_MESSAGE_ID');
        return;
      }
      let notificationDetail = await SystemNotificationResourceAccess.findById(data.id);
      if (notificationDetail) {
        // Cộng lượt view cho thông báo khi được xem
        await _increaseView(notificationDetail.systemNotificationId, notificationDetail.totalViewed);
        // await SystemNotificationResourceAccess.updateById(data.id, { isRead: NOTIFICATION_ACTION_STATUS.READ });
        resolve(notificationDetail);
      } else {
        resolve({});
      }
    } catch (error) {
      Logger.error('find system notification detail error', error);
      reject('failed');
    }
  });
}

async function getDetailById(req) {
  return await _findDetailById(req);
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;
      let updateResult = await SystemNotificationResourceAccess.updateById(id, data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject('failed');
      }
    } catch (error) {
      Logger.error('update notification detail error', error);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await SystemNotificationResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (error) {
      Logger.error('delete notification detail error', error);
      reject('failed');
    }
  });
}

// XỬ lý cập nhật số lượt xem thông báo hệ thống
let CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER = {};
let needToUpdateViewCount = false;

//1 giờ 1 lần sẽ cập nhật lượt view vào database
setInterval(async () => {
  if (needToUpdateViewCount) {
    needToUpdateViewCount = false;
    let listSysNoti = Object.keys(CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER);
    for (let i = 0; i < listSysNoti.length; i++) {
      const _key = listSysNoti[i];
      if (CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER[_key] && CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER[_key] * 1 > 0) {
        await SystemNotificationResourceAccess.updateById(_key, { totalViewed: CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER[_key] });
      }
    }
  }
}, 1000 * 30);

async function _increaseView(id, previousView) {
  if (CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER[id]) {
    CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER[id] += 1;
  } else {
    CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER[id] = 0;
    const viewCount = previousView ? ++previousView : 1;
    CACHE_VIEWS_SYSTEM_NOTIFICATION_COUNTER[id] += viewCount;
  }
  needToUpdateViewCount = true;
}

async function _increaseViewForListSysNoti(listSysNotification) {
  const promiseBunch = listSysNotification.map(noti => _increaseView(noti.systemNotificationId, noti.totalViewed));

  await Promise.all(promiseBunch);
}

module.exports = {
  insert,
  robotInsert,
  findById,
  find,
  updateById,
  getDetailById,
  getList,
  deleteById,
};
