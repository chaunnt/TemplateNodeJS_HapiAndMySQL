/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppSharingRoute = require('./AppSharingRoute');

module.exports = [
  { method: 'GET', path: '/AppSharing/StationNews/{stationNewsId}', config: AppSharingRoute.shareStationNew },
  { method: 'GET', path: '/AppSharing/Stations/{stationCode}', config: AppSharingRoute.shareStation },
];
