/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationNewsResourceAccess = require('../StationNews/resourceAccess/StationNewsResourceAccess');
const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const { STATION_TYPE } = require('../Stations/StationsConstants');
const ApiUtilsFunctions = require('../ApiUtils/utilFunctions');

async function getNewsInfo(stationNewsId) {
  const stationNew = await StationNewsResourceAccess.findById(stationNewsId);

  if (!stationNew) {
    return undefined;
  }

  const newsInfo = {
    title: stationNew.stationNewsTitle,
    shortDescription: stationNew.stationNewsTitle,
    imageUrl: stationNew.stationNewsAvatar,
    pageUrl: `https://ttdk.com.vn/detail-post/${stationNewsId}`,
  };

  return newsInfo;
}

async function getStation(stationCode) {
  const stationExisted = await StationsResourceAccess.find({ stationCode: stationCode }, 0, 1);
  const station = stationExisted[0];

  if (!station || station.length === 0) {
    return undefined;
  }

  let imageUrl = station.stationsLogo;
  if (station.stationType === STATION_TYPE.EXTERNAL) {
    if (!ApiUtilsFunctions.isNotEmptyStringValue(imageUrl)) {
      imageUrl = `https://${process.env.WEB_HOST_NAME}/logo-vr.png`;
    }
  } else {
    imageUrl = `https://${process.env.WEB_HOST_NAME}/logo.png`;
  }

  const stationInfo = {
    title: station.stationsName,
    shortDescription: station.stationsAddress,
    imageUrl: imageUrl,
    pageUrl: `https://${process.env.WEB_HOST_NAME}/station/${station.stationCode}`,
  };

  return stationInfo;
}

module.exports = {
  getNewsInfo,
  getStation,
};
