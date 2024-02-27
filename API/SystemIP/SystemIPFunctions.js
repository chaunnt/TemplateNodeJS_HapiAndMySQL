/* Copyright (c) 2023 Reminano */

'use strict';

const SystemIPResource = require('./resourceAccess/SystemIPResourceAccess');

async function insertNewSystemIP(data) {
  // máy chủ của mình sẽ không lưu
  let ipServer = process.env.IP_SERVER;

  if (data.IP === ipServer) {
    return true;
  }

  let createdResult = await SystemIPResource.insert(data);
  return createdResult;
}

module.exports = {
  insertNewSystemIP,
};
