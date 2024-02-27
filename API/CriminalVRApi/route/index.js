/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const CriminalVRApiRoute = require('./CriminalVRApiRoute');

module.exports = [
  { method: 'POST', path: '/CriminalVRApi/checkCriminalFromVr', config: CriminalVRApiRoute.checkCriminalFromVr },
  { method: 'POST', path: '/CriminalVRApi/user/userCheckCriminalFromVr', config: CriminalVRApiRoute.userCheckCriminalFromVr },
];
