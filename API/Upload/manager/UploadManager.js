/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const UploadFunctions = require('../UploadFunctions');
const Logger = require('../../../utils/logging');
const { moveFileFromLocalToLinode } = require('../../../ThirdParty/LinodeStorage/LinodeStorageFunctions');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
async function uploadMediaFile(req) {
  return new Promise(async (resolve, reject) => {
    try {
      // booksChapterUrl: Joi.string(),
      const imageData = req.payload.imageData;
      const imageFormat = req.payload.imageFormat;

      if (!imageData) {
        reject('do not have book data');
        return;
      }

      var originaldata = Buffer.from(imageData, 'base64');
      let newMediaUrl = await UploadFunctions.uploadMediaFile(originaldata, imageFormat);
      if (newMediaUrl) {
        if (process.env.LINODE_ENABLE && process.env.LINODE_ENABLE * 1 === 1) {
          let _fileName = newMediaUrl.split('uploads/');
          if (_fileName.length > 1) {
            _fileName = process.cwd() + '/uploads/' + _fileName[1];
            let _newUrl = await moveFileFromLocalToLinode(_fileName);
            return resolve(_newUrl);
          }
        }
        resolve(newMediaUrl);
      } else {
        reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function uploadAdMediaFile(req) {
  return new Promise(async (resolve, reject) => {
    try {
      // booksChapterUrl: Joi.string(),
      const imageData = req.payload.imageData;
      const imageFormat = req.payload.imageFormat;

      if (!imageData) {
        reject('do not have book data');
        return;
      }

      var originaldata = Buffer.from(imageData, 'base64');
      let newMediaUrl = await UploadFunctions.uploadMediaFile(originaldata, imageFormat, 'media/quangcao/');
      if (newMediaUrl) {
        resolve(newMediaUrl);
      } else {
        reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function uploadUserAvatar(req) {
  return new Promise(async (resolve, reject) => {
    try {
      // booksChapterUrl: Joi.string(),
      const imageData = req.payload.image;
      const imageFormat = req.payload.imageFormat;
      const appUserId = req.currentUser.appUserId;

      if (!imageData) {
        reject('do not have book data');
        return;
      }

      if (!appUserId) {
        reject('do not have user id');
        return;
      }

      var originaldata = Buffer.from(imageData, 'base64');
      let newAvatar = await UploadFunctions.uploadMediaFile(originaldata, imageFormat);
      if (newAvatar) {
        resolve(newAvatar);
      } else {
        reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  uploadMediaFile,
  uploadUserAvatar,
  uploadAdMediaFile,
};
