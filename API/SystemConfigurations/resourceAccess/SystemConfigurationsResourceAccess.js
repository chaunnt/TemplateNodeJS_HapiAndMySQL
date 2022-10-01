/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { STATUS } = require('../SystemConfigurationConstant');
const tableName = 'SystemConfigurations';
const primaryKeyField = 'systemConfigurationsId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.double('exchangeRateCoin'); // tỉ lệ quy đổi xu (VND > XU)
          table.string('telegramGroupUrl').defaultTo('https://telegram.com'); // link group telegram
          table.string('fbMessengerUrl').defaultTo('https://messenger.com'); // link messenger FB
          table.string('zaloUrl').defaultTo('https://zalo.com'); //link zalo OA
          table.string('playStoreUrl').defaultTo('https://play.google.com/'); //link play store
          table.string('appStoreUrl').defaultTo('https://apps.apple.com/'); //link app store
          table.string('instagramUrl').defaultTo('https://instagram.com'); //link instagram
          table.string('facebookUrl').defaultTo('https://facebook.com'); // link fan page facebook
          table.string('twitterUrl').defaultTo('https://twitter.com'); // link fan page twitter
          table.string('youtubeUrl').defaultTo('https://youtube.com'); // link channel youtube
          table.string('websiteUrl').defaultTo('https://google.com'); // website chinh
          table.string('hotlineNumber').defaultTo('123456789'); //hotline
          table.string('supportEmail').defaultTo('supportEmail@gmail.com'); //hotline
          table.string('address').defaultTo('123 Ho Chi Minh, VietNam'); //dia chi cong ty
          table.string('systemVersion').defaultTo('1.0.0'); //version he thong
          table.float('exchangeVNDPrice', 48, 24).defaultTo(0.001); //gia quy doi USD - VND
          table.integer('packageCurrentStage').defaultTo(1); // << giai doan
          table.timestamp('packageStageTimeCheck', { useTz: true }).defaultTo(DB.fn.now());
          table.string('bannerImage1').defaultTo(`https://${process.env.HOST_NAME}/uploads/sample_banner.png`);
          table.string('bannerImage2').defaultTo(`https://${process.env.HOST_NAME}/uploads/sample_banner.png`);
          table.string('bannerImage3').defaultTo(`https://${process.env.HOST_NAME}/uploads/sample_banner.png`);
          table.string('bannerImage4').defaultTo(`https://${process.env.HOST_NAME}/uploads/sample_banner.png`);
          table.string('bannerImage5').defaultTo(`https://${process.env.HOST_NAME}/uploads/sample_banner.png`);
          table.string('linkBannerImage1');
          table.string('linkBannerImage2');
          table.string('linkBannerImage3');
          table.string('linkBannerImage4');
          table.string('linkBannerImage5');
          table.string('introAboutUs', 2500).defaultTo('introAboutUs');
          table.string('introPolicy', 2500).defaultTo('introPolicy');
          table.string('introTermUsage', 2500).defaultTo('introTermUsage');
          table.string('introOverview', 2500).defaultTo('introOverview');
          table.string('introQuestionAndAnswer', 2500).defaultTo('introQuestionAndAnswer');
          table.string('supportChatUrlEN').defaultTo(`https://tawk.io`); //kenh chatbox support bang tieng Anh
          table.string('supportChatUrlVI').defaultTo(`https://tawk.io`); //kenh chatbox support bang tieng Viet
          table.string('supportChatUrlCN').defaultTo(`https://tawk.io`); //kenh chatbox support bang tieng Trung Quoc
          table.string('supportChatUrlPL').defaultTo(`https://tawk.io`); //kenh chatbox support bang tieng Philipines
          table.integer('enableStakingModule').defaultTo(0); // 1 / 0 = On/Off
          table.integer('enableBonusModule').defaultTo(0); // 1 / 0 = On/Off
          table.string('USDTWalletAddress');
          table.double('totalSystemUser', 24).defaultTo(10);
          table.float('totalBetAmount', 48, 24).defaultTo(1000);
          table.double('totalActiveUser', 24).defaultTo(0);
          table.integer('totalWorkingServicePackages').defaultTo(0); // tổng số tài khoản khai thác FAC
          table.double('totalBetRecordWinAmount').defaultTo(0); // Tổng số FAC khai thác được
          table.integer('currentPhaseNumber').defaultTo(1); // phase number
          table.double('exchangeRateCoin1').defaultTo(0); // giá coin phase 1
          table.double('exchangeRateCoin2').defaultTo(0); // giá coin phase 2
          table.double('exchangeRateCoin3').defaultTo(0); // giá coin phase 3
          table.double('exchangeRateCoin4').defaultTo(0); // giá coin phase 4
          table.double('exchangeRateCoin5').defaultTo(0); // giá coin phase 5
          table.string('stage1LastDate'); // ngay ket thuc giai doan 1
          table.string('stage2LastDate'); // ngay ket thuc giai doan 2
          table.string('stage3LastDate'); // ngay ket thuc giai doan 3
          table.string('stage4LastDate'); // ngay ket thuc giai doan 4
          table.string('stage5LastDate'); // ngay ket thuc giai doan 5
          table.integer('storedFee').defaultTo(10000); // phi giu ho ve
          table.float('ticketPrice', 20, 5).defaultTo(10000); // gia ve
          table.integer('discountPercentage').defaultTo(0); // phan tram khuyen mai nap tien
          timestamps(table);
          table.index(`${primaryKeyField}`);
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(() => {
            resolve();
          });
        });
    });
  });
}

async function seeding() {
  let projectStatus = [
    {
      systemVersion: '1.0.0',
      exchangeRateCoin: 1000,
      bannerImage1: `https://${process.env.HOST_NAME}/uploads/sample_banner.png`,
      bannerImage2: `https://${process.env.HOST_NAME}/uploads/sample_banner.png`,
      bannerImage3: `https://${process.env.HOST_NAME}/uploads/sample_banner.png`,
    },
  ];
  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(projectStatus)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
      });
  });
}

async function initDB() {
  await createTable();
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function getCurrentStage() {
  let configs = await Common.find(tableName, {}, 0, 1);
  configs = configs[0];
  return configs.packageCurrentStage;
}

module.exports = {
  find,
  updateById,
  initDB,
  getCurrentStage,
};
