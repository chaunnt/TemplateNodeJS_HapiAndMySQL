/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'user strict';
const moment = require('moment');

const StationDocumentResourceAccess = require('../resourceAccess/StationDocumentResourceAccess');
const { UNKNOWN_ERROR, NOT_FOUND, MISSING_AUTHORITY, API_FAILED } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const {
  getDetailDocumentById,
  updateReadStatus,
  getStationReadCount,
  getStationListNotViewDocument,
  notifyNewDocumentToAppUser,
  attachDetailDataForDocument,
  syncFilesForDocumentById,
} = require('../StationDocumentFunctions');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { publishJson } = require('../../../ThirdParty/MQTTBroker/MQTTBroker');
const StaffResourceAccess = require('../../Staff/resourceAccess/StaffResourceAccess');
const { DATE_DB_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { STATION_ADMIN_ROLE } = require('../../AppUserRole/AppUserRoleConstant');
const { STATION_TYPE } = require('../../Stations/StationsConstants');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;

      data.documentPublishedDay = moment().format('DD/MM/YYYY');
      data.documentPublishedDate = moment().format();

      let _documentFileList = [];
      if (data.documentFileUrlList) {
        _documentFileList = JSON.parse(JSON.stringify(data.documentFileUrlList));
        delete data.documentFileUrlList;
      }

      const result = await StationDocumentResourceAccess.insert(data);
      if (result) {
        let _newDocumentId = result[0];
        await syncFilesForDocumentById(_newDocumentId, _documentFileList);

        await notifyNewDocumentToAppUser(data.documentTitle);

        // send new document to user via socket
        await publishJson('GENERAL_STATION', data);

        return resolve(result);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let searchText = req.payload.searchText;
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      let stationDocumentRecords = await StationDocumentResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (stationDocumentRecords && stationDocumentRecords.length > 0) {
        const documentCount = await StationDocumentResourceAccess.customCount(filter, undefined, undefined, searchText);

        const totalStationsCount = await StationsResourceAccess.count({
          stationType: STATION_TYPE.EXTERNAL,
        });

        stationDocumentRecords = await attachDetailDataForDocument(stationDocumentRecords, totalStationsCount);

        return resolve({ data: stationDocumentRecords, total: documentCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await await getDetailDocumentById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const oldRecord = await StationDocumentResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      } else {
        const result = await StationDocumentResourceAccess.deleteById(id);
        if (result === 1) {
          return resolve('success');
        } else {
          return reject(UNKNOWN_ERROR);
        }
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
      const id = req.payload.id;
      const updateData = req.payload.data;

      const targetRecord = await StationDocumentResourceAccess.findById(id);

      let _documentFileList = [];
      if (updateData.documentFileUrlList) {
        _documentFileList = JSON.parse(JSON.stringify(updateData.documentFileUrlList));
        delete updateData.documentFileUrlList;
      }

      if (targetRecord) {
        const result = await StationDocumentResourceAccess.updateById(id, updateData);
        if (result && result !== 0) {
          await syncFilesForDocumentById(id, _documentFileList);

          return resolve('success');
        } else {
          return reject('failed');
        }
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetListDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let searchText = req.payload.searchText;
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      filter.stationsId = req.currentUser.stationsId;

      let stationDocumentRecords = await StationDocumentResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (stationDocumentRecords && stationDocumentRecords.length > 0) {
        for (let i = 0; i < stationDocumentRecords.length; i++) {
          stationDocumentRecords[i] = await getDetailDocumentById(stationDocumentRecords[i].stationDocumentId, req.currentUser.appUserId);
        }
        const documentCount = await StationDocumentResourceAccess.customCount(filter, undefined, undefined, searchText);

        return resolve({ data: stationDocumentRecords, total: documentCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetAdminDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let searchText = req.payload.searchText;
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      //lay danh sach tai lieu do admin tao ra
      filter.stationsId = null;

      let stationDocumentRecords = await StationDocumentResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (stationDocumentRecords && stationDocumentRecords.length > 0) {
        for (let i = 0; i < stationDocumentRecords.length; i++) {
          stationDocumentRecords[i] = await getDetailDocumentById(stationDocumentRecords[i].stationDocumentId, req.currentUser.appUserId);
        }
        const documentCount = await StationDocumentResourceAccess.customCount(filter, undefined, undefined, searchText);

        return resolve({ data: stationDocumentRecords, total: documentCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetDetailDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      //Thêm appUserId để biết user này đã đọc tài liệu
      const result = await getDetailDocumentById(id, req.currentUser.appUserId);
      if (result) {
        await updateReadStatus(id, req.currentUser.appUserId, req.currentUser.stationsId);
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getListStationsNotViewDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const stationCodeList = await getStationListNotViewDocument(id);

      if (stationCodeList) {
        return resolve(stationCodeList);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserAddDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      const stationsId = req.currentUser.stationsId;

      if (stationsId) {
        data.stationsId = stationsId;
      }

      const result = await _addStationDocument(data);

      await _notifyNewDocumentToAdmin(data);

      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _notifyNewDocumentToAdmin(documentData) {
  const MAX_COUNT = 20;
  const adminList = await StaffResourceAccess.find({ roleId: STATION_ADMIN_ROLE }, 0, MAX_COUNT);

  if (adminList && adminList.length > 0) {
    for (let admin of adminList) {
      await publishJson(`NEW_STATION_DOCUMENT_${admin.staffId}`, documentData);
    }
  }
}

async function advanceUserRemoveDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const oldRecord = await StationDocumentResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      }

      if (oldRecord.stationsId !== req.currentUser.stationsId || req.currentUser.appUserRoleId !== STATION_ADMIN_ROLE) {
        return reject(MISSING_AUTHORITY);
      }

      const result = await StationDocumentResourceAccess.deleteById(id);
      if (result !== undefined) {
        return resolve('success');
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserUpdateDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updateData = req.payload.data;

      const targetRecord = await StationDocumentResourceAccess.findById(id);

      if (!targetRecord) {
        return reject(NOT_FOUND);
      }

      if (targetRecord.stationsId !== req.currentUser.stationsId || req.currentUser.appUserRoleId !== STATION_ADMIN_ROLE) {
        return reject(MISSING_AUTHORITY);
      }

      _documentFileList = [];
      if (updateData.documentFileUrlList) {
        _documentFileList = JSON.parse(JSON.stringify(updateData.documentFileUrlList));
        delete updateData.documentFileUrlList;
      }

      if (targetRecord) {
        const result = await StationDocumentResourceAccess.updateById(id, updateData);
        if (result && result !== 0) {
          await syncFilesForDocumentById(id, _documentFileList);

          return resolve('success');
        } else {
          return reject('failed');
        }
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _addStationDocument(data) {
  try {
    data.documentPublishedDay = moment().format(DATE_DB_FORMAT);
    data.documentPublishedDate = moment().format();

    let _documentFileList = [];
    if (data.documentFileUrlList) {
      _documentFileList = JSON.parse(JSON.stringify(data.documentFileUrlList));
      delete data.documentFileUrlList;
    }

    const result = await StationDocumentResourceAccess.insert(data);
    if (result) {
      let _newDocumentId = result[0];
      await syncFilesForDocumentById(_newDocumentId, _documentFileList);
      return result;
    } else {
      throw API_FAILED;
    }
  } catch (e) {
    Logger.error(__filename, e);
    throw UNKNOWN_ERROR;
  }
}

async function adminUploadDocumentForStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;

      const result = await _addStationDocument(data);

      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  deleteById,
  updateById,
  advanceUserGetAdminDocument,
  advanceUserGetDetailDocument,
  advanceUserGetListDocument,
  advanceUserUpdateDocument,
  getListStationsNotViewDocument,
  advanceUserAddDocument,
  advanceUserRemoveDocument,
  adminUploadDocumentForStation,
};
