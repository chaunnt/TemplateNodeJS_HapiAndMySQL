/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationDocumentResourceAccess = require('./resourceAccess/StationDocumentResourceAccess');
const StationDocumentFileResourceAccess = require('./resourceAccess/StationDocumentFileResourceAccess');
const StationDocumentReadingResourceAccess = require('./resourceAccess/StationDocumentReadingResourceAccess');
const StationResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const CustomerMessageFunctions = require('../CustomerMessage/CustomerMessageFunctions');
const AppUserRoleResourceAccess = require('../AppUserRole/resourceAccess/AppUserRoleResourceAccess');
const FirebaseFunctions = require('../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');
const RoleUserView = require('../AppUsers/resourceAccess/RoleUserView');
const { MAX_LIMIT_FILE_PER_DOCUMENT, READING_STATUS } = require('./StationDocumentConstants');
const { STATION_TYPE } = require('../Stations/StationsConstants');

async function getDetailDocumentById(documentId, appUserId) {
  let _existingDocument = await StationDocumentResourceAccess.findById(documentId);
  const UNKNOWN_DOCUMENT = undefined;
  if (!_existingDocument) {
    return UNKNOWN_DOCUMENT;
  }

  let _documentFiles = await StationDocumentFileResourceAccess.find(
    {
      stationDocumentId: documentId,
    },
    0,
    MAX_LIMIT_FILE_PER_DOCUMENT,
  );

  if (_documentFiles) {
    _existingDocument.documentFiles = _documentFiles;
  }

  if (appUserId) {
    const READ_ID = `${documentId}_${appUserId}`;
    let _readStatusData = await StationDocumentReadingResourceAccess.findById(READ_ID);
    if (_readStatusData) {
      _existingDocument.readStatus = READING_STATUS.ALREADY_READ;
    } else {
      _existingDocument.readStatus = READING_STATUS.NOT_READ;
    }
  }

  return _existingDocument;
}

async function updateReadStatus(documentId, appUserId, stationsId) {
  const READ_ID = `${documentId}_${appUserId}`;
  let _readStatusData = await StationDocumentReadingResourceAccess.findById(READ_ID);
  if (!_readStatusData) {
    const data = {
      appUserId: appUserId,
      stationDocumentId: documentId,
      stationDocumentReadingId: READ_ID,
    };

    if (stationsId) {
      data.stationsId = stationsId;
    }

    await StationDocumentReadingResourceAccess.insert(data);
  }
}

async function getStationListNotViewDocument(documentId) {
  const MAX_LIMIT_COUNT = 500;
  const stationList = await StationResourceAccess.find(
    {
      stationType: STATION_TYPE.EXTERNAL,
    },
    0,
    MAX_LIMIT_COUNT,
  );
  const documentReadingList = await StationDocumentReadingResourceAccess.find({ stationDocumentId: documentId });
  const stationReadDocumentIdList = [];
  if (documentReadingList && documentReadingList.length > 0) {
    documentReadingList.forEach(documentReading => {
      if (documentReading.stationsId) {
        stationReadDocumentIdList.push(documentReading.stationsId);
      }
    });
  }

  const notViewStationCodeList = [];
  for (station of stationList) {
    if (!stationReadDocumentIdList.includes(station.stationsId)) {
      notViewStationCodeList.push(station.stationCode);
    }
  }

  return notViewStationCodeList;
}

async function getStationReadCount(documentId, totalStation) {
  const stationsNotView = await getStationListNotViewDocument(documentId);
  if (stationsNotView && stationsNotView.length >= 0) {
    return totalStation - stationsNotView.length;
  }
  return 0;
}

async function notifyNewDocumentToAppUser(documentTitle) {
  const MAX_COUNT = 20;
  const appUserRole = await AppUserRoleResourceAccess.find({}, 0, MAX_COUNT);
  if (appUserRole && appUserRole.length > 0) {
    const roleIdList = appUserRole.map(role => role.appUserRoleId);

    let skip = 0;
    while (true) {
      const appUserBunch = await RoleUserView.customSearch({ appUserRoleId: roleIdList }, skip, 50);
      if (appUserBunch && appUserBunch.length > 0) {
        const notifyNewDocumentPromiseList = appUserBunch.map(
          appUser =>
            new Promise(async resolve => {
              const notifyTitle = 'Có công văn mới';
              await CustomerMessageFunctions.addMessageCustomer(notifyTitle, undefined, documentTitle, undefined, appUser.appUserId);
              if (appUser.firebaseToken) {
                FirebaseFunctions.pushNotificationByTokens(appUser.firebaseToken, notifyTitle, documentTitle);
              }
              resolve('ok');
            }),
        );
        await Promise.all(notifyNewDocumentPromiseList);
      } else {
        break;
      }
      skip += 50;
    }
  }
}

async function attachDetailDataForDocument(documentList, stationCount) {
  const promiseList = documentList.map(async document => {
    let detailDocument = await getDetailDocumentById(document.stationDocumentId);

    const stationsReadCount = await getStationReadCount(document.stationDocumentId, stationCount);

    detailDocument.totalCountStation = stationCount;
    detailDocument.totalViewedStation = stationsReadCount || 0;

    return detailDocument;
  });

  return Promise.all(promiseList);
}

async function getFileListForDocumentById(stationDocumentId) {
  let _documentFiles = await StationDocumentFileResourceAccess.find(
    {
      stationDocumentId: stationDocumentId,
    },
    0,
    MAX_LIMIT_FILE_PER_DOCUMENT,
  );
  if (_documentFiles && _documentFiles.length > 0) {
    return _documentFiles;
  } else {
    return [];
  }
}

async function syncFilesForDocumentById(stationDocumentId, newDocumentData) {
  let _documentFiles = await getFileListForDocumentById(stationDocumentId);
  let _documentFilesUrl = _documentFiles.map(_documentFile => {
    return _documentFile.documentFileUrl;
  });
  let _newDocumentFileUrl = newDocumentData.map(_documentFile => {
    return _documentFile.documentFileUrl;
  });

  function _shouldAddFile(fileUrl) {
    return _documentFilesUrl.indexOf(fileUrl) < 0;
  }
  function _shoudDeleteFile(fileUrl) {
    return _newDocumentFileUrl.indexOf(fileUrl) < 0;
  }

  const _newFileUrls = _newDocumentFileUrl.filter(_shouldAddFile);
  const _deletedFileUrls = _documentFilesUrl.filter(_shoudDeleteFile);
  for (let i = 0; i < _documentFiles.length; i++) {
    if (_deletedFileUrls.indexOf(_documentFiles[i].documentFileUrl) >= 0) {
      await StationDocumentFileResourceAccess.deleteById(_documentFiles[i].stationDocumentFileId);
    }
  }

  for (let i = 0; i < newDocumentData.length; i++) {
    if (_newFileUrls.indexOf(newDocumentData[i].documentFileUrl) >= 0) {
      await StationDocumentFileResourceAccess.insert({
        ...newDocumentData[i],
        stationDocumentId: stationDocumentId,
      });
    } else {
      await StationDocumentFileResourceAccess.updateById(_documentFiles[i].stationDocumentFileId, newDocumentData[i]);
    }
  }
}
module.exports = {
  getDetailDocumentById,
  updateReadStatus,
  getStationListNotViewDocument,
  getStationReadCount,
  getFileListForDocumentById,
  notifyNewDocumentToAppUser,
  syncFilesForDocumentById,
  attachDetailDataForDocument,
};
