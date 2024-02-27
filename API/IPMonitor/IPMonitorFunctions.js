/* Copyright (c) 2023 Reminano */

'use strict';

const IPMonitorResourceAccess = require('../IPMonitor/resourceAccess/IPMonitorResourceAccess');
const { IP_MONITOR_TYPE } = require('./IPMonitorConstant');

async function isIpBannedFromBlackList(ipAddress) {
  let result = await IPMonitorResourceAccess.find(
    {
      ipAddress: ipAddress,
      ipMonitorType: IP_MONITOR_TYPE.BLACKLIST,
    },
    0,
    1,
  );

  if (result && result.length > 0) {
    return true;
  } else {
    return false;
  }
}

async function isIpAllowedFromWhiteList(ipAddress) {
  let result = await IPMonitorResourceAccess.find(
    {
      ipAddress: ipAddress,
      ipMonitorType: IP_MONITOR_TYPE.WHITELIST,
    },
    0,
    1,
  );

  if (result && result.length > 0) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  isIpAllowedFromWhiteList,
  isIpBannedFromBlackList,
};
