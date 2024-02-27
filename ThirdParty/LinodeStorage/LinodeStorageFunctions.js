/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();

const Credentials = require('aws-sdk').Credentials;
const crypto = require('crypto');
const fs = require('fs');
const moment = require('moment');
const S3 = require('aws-sdk/clients/s3');
const path = require('path');
const Logger = require('../../utils/logging');

const s3Client = new S3({
  region: process.env.LINODE_OBJECT_STORAGE_REGION,
  endpoint: process.env.LINODE_OBJECT_STORAGE_ENDPOINT,
  sslEnabled: true,
  s3ForcePathStyle: false,
  credentials: new Credentials({
    accessKeyId: process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.LINODE_OBJECT_STORAGE_SECRET_KEY,
  }),
});

async function deleteFileFromObjectStorage(url) {
  const Key = url.split(`${process.env.LINODE_OBJECT_STORAGE_ENDPOINT}/`)[1];
  const params = {
    Bucket: process.env.LINODE_OBJECT_STORAGE_BUCKET_NAME,
    Key,
  };

  // see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
  // eslint-disable-next-line consistent-return
  return s3Client.deleteObject(params).promise();
}

function _createHashFileName(fullFilePath) {
  const _hashFileName = crypto.createHmac('sha256', 'ThisIsLinodeSecretKey').update(fullFilePath).digest('hex');
  return _hashFileName;
}
async function uploadFileToObjectStorage(fullFilePath, fileType = 'image', extension = 'png') {
  const path = moment().format('YYYYMMDD');
  let base64Data = fs.readFileSync(fullFilePath);
  const params = {
    Bucket: process.env.LINODE_OBJECT_STORAGE_BUCKET_NAME,
    Key: `${path}/${_createHashFileName(fullFilePath)}.${extension}`,
    Body: base64Data,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: `${fileType}/${extension}`,
  };

  // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
  const { Location } = await s3Client
    .upload(params)
    .promise()
    .catch(error => {
      Logger.error(`uploadFileToObjectStorage error ${fullFilePath}`);
      return undefined;
    });

  if (Location) {
    Logger.info(`uploadFileToObjectStorage: ${Location}`);
    return Location;
  }

  return undefined;
}

// uploadFileToObjectStorage('DatabaseDesign.png','image','png');
// moveFileFromLocalToLinode('uploads/Sample.png');
async function moveFileFromLocalToLinode(fullFilePath) {
  Logger.info(`moveFileFromLocalToLinode ${fullFilePath}`);
  let _isExisted = fs.existsSync(fullFilePath);
  Logger.info(`_isExisted ${_isExisted}`);
  if (_isExisted) {
    let _fileType = 'image';
    let uploadResult = await uploadFileToObjectStorage(fullFilePath, _fileType, path.extname(fullFilePath));
    if (uploadResult) {
      fs.unlinkSync(fullFilePath);
      return uploadResult;
    }
  }
  return undefined;
}
module.exports = {
  uploadFileToObjectStorage,
  deleteFileFromObjectStorage,
  moveFileFromLocalToLinode,
};
