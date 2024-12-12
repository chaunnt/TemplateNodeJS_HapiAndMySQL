/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const requestIP = require('request-ip');
const nodeCache = require('node-cache');
const isIp = require('is-ip');
require('dotenv').config();

const { reportToTelegram } = require('../../ThirdParty/TelegramBot/TelegramBotFunctions');
const token = require('../ApiUtils/token');
const { isInvalidStringValue, isNotEmptyStringValue } = require('../ApiUtils/utilFunctions');
const MaintainFunctions = require('../Maintain/MaintainFunctions');
const errorCodes = require('./route/response').errorCodes;
const UserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const StaffResource = require('../Staff/resourceAccess/RoleStaffView');
const Logger = require('../../utils/logging');
const StaffUserResourceAccess = require('../StaffUser/resourceAccess/StaffUserResourceAccess');
const { ROLE_NAME } = require('../StaffRole/StaffRoleConstants');
const moment = require('moment');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const StaffResourceAccess = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserRoleResourceAccess = require('../AppUserRole/resourceAccess/AppUserRoleResourceAccess');
const { getListLockIp } = require('../AppUsers/data/lockIpAddress');
const { NORMAL_USER_ROLE, STATION_ADMIN_ROLE } = require('../AppUserRole/AppUserRoleConstant');
const SystemApiKeyFunction = require('../SystemApiKey/SystemApiKeyFunction');

const TIME_FRAME_IN_S = 10;
const TIME_FRAME_IN_MS = TIME_FRAME_IN_S * 1000;
const MS_TO_S = 1 / 1000;
const RPS_LIMIT = 20;

const IPCache = new nodeCache({ stdTTL: TIME_FRAME_IN_S, deleteOnExpire: false, checkperiod: TIME_FRAME_IN_S });
const updateCacheIP = (ip, ttl = (IPCache.getTtl(ip) - Date.now()) * MS_TO_S || TIME_FRAME_IN_S) => {
  let IPArray = IPCache.get(ip) || [];
  IPArray.push(new Date());
  IPCache.set(ip, IPArray, ttl);
};

const apiKeyList = {
  ZALO_MINI_APP: '7f46fd43-5ebd-47eb-b368-c583313d12ef',
  KGO_MINI_APP: 'da78df6c-b7ce-4408-af8b-7e0183a2e75d',
  VUCAR_MINI_APP: 'd6cc772f-2113-4580-aef8-df24d36c1f45',
  ANVUI_MINI_APP: '36f7a6d9-a3a7-4e7d-bc18-e2a314ba55a4',
  VTGO_MINI_APP: '06641c91-d30d-4934-bb5d-80cd2ae71b21',
  MOMO_MINI_APP: '2898a2a7-bdde-414a-8ef8-272328be6c82',
  MCI_MINI_APP: '8badb9c3-dcd5-4a09-a9f0-7b7800c42a4c',
  VNPAY_MINI_APP: '375437ea-5ce4-4ef8-b2e8-ce3b03f04679',
  VIETTEL_PAY_MINI_APP: 'efd960c6-dd40-433f-9841-fc8e2b52f0d5',
  BUTL_MINI_APP: '869e5f91-85ff-442a-9bdd-47895334199b',
};

async function verifyPartnerApiKey(request, reply) {
  return new Promise(async function (resolve) {
    let _apiKeyHeaders = request.headers.apikey;
    let _apiKeyParam = request.query.apikey;

    let _apiKey = '';
    if (_apiKeyHeaders) {
      _apiKey = _apiKeyHeaders;
    } else if (_apiKeyParam) {
      _apiKey = _apiKeyParam;
    }

    // !!FEATURE 20230221 Tracking hacker IPs
    //store IP & last login
    const requestIp = require('request-ip');
    const clientIp = requestIp.getClientIp(request);

    // Kiểm tra apikey hợp lệ
    let validApikey = await SystemApiKeyFunction.checkValidApiKey(_apiKey);

    if (!validApikey) {
      await reportToTelegram(`!! someone ${clientIp}  using wrong apikey ${_apiKey} !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (getListLockIp().includes(clientIp)) {
      await reportToTelegram(`!! blocked ip ${clientIp} try to request !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //append current user to request
    request.currentPartner = {
      partnerName: validApikey.apiKeyName,
    };

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

//Hàm này dùng để kiểm tra request theo SYSTEM_API_KEY
//Hầu hết các API này chỉ để nội bộ hệ thống sử dụng, không public cho bất kỳ bên nào
async function verifySystemApiKey(request, reply) {
  return new Promise(async function (resolve) {
    let _apiKeyHeaders = request.headers.apikey;
    let _apiKeyParam = request.query.apikey;

    let _apiKey = '';
    if (_apiKeyHeaders) {
      _apiKey = _apiKeyHeaders;
    } else if (_apiKeyParam) {
      _apiKey = _apiKeyParam;
    }

    // !!FEATURE 20230221 Tracking hacker IPs
    //store IP & last login
    const requestIp = require('request-ip');
    const clientIp = requestIp.getClientIp(request);

    // Kiểm tra apikey hợp lệ
    let validApikey = isNotEmptyStringValue(process.env.SYSTEM_API_KEY) && _apiKey === process.env.SYSTEM_API_KEY;

    if (!validApikey) {
      await reportToTelegram(`!! someone ${clientIp}  using wrong apikey ${_apiKey} !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (getListLockIp().includes(clientIp)) {
      await reportToTelegram(`!! blocked ip ${clientIp} try to request api criminal VR !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

function isValidUserAccessToken(accessToken) {
  let _currentUser = token.decodeToken(accessToken);

  //invalid token
  if (_currentUser === undefined) {
    Logger.error(`invalid token`);
    return;
  }

  if (!_currentUser.active) {
    return;
  }

  return _currentUser;
}

async function verifyToken(request, reply) {
  //store IP & last login
  const requestIp = require('request-ip');
  const clientIp = requestIp.getClientIp(request);
  console.log(clientIp);
  return new Promise(async function (resolve) {
    let requestToken = request.headers.authorization;
    let result = token.decodeToken(requestToken);

    // !!FEATURE 20230221 Tracking hacker IPs
    //store IP & last login
    const requestIp = require('request-ip');
    const clientIp = requestIp.getClientIp(request);

    if (getListLockIp().includes(clientIp)) {
      await reportToTelegram(`!! blocked ip ${clientIp} try to request !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //if there is no token or empty token
    if (!(request.headers.authorization && request.headers.authorization !== '')) {
      Logger.error(`System was down - current active status = ${MaintainFunctions.getSystemStatus().all}`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    let result = isValidUserAccessToken(request.headers.authorization);

    //invalid token
    if (result === undefined) {
      console.error(`invalid token`);
      await reportToTelegram(`!! some one using invalid token from ${clientIp} : ${requestToken}`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //append current user to request
    request.currentUser = result;

    //khoa lai IP, gioi han rate limit tren moi truong production
    //khong khoa IP doi voi nhan vien trung tam
    console.info(`verifyToken ${clientIp} - ${request.currentUser.appUserId}`);
    if (process.env.NODE_ENV === 'production' && request.currentUser.appUserRoleId === NORMAL_USER_ROLE) {
      const _currentUserInfo = `${request.currentUser.appUserId ? request.currentUser.appUserId : ''} - ${
        request.currentUser.phoneNumber ? request.currentUser.phoneNumber : ''
      }`;
      if (process.env.ENABLE_TRACK && process.env.ENABLE_TRACK * 1 === 1) {
        console.info(`111${clientIp} - ${request.currentUser.appUserId}`);
      }
      updateCacheIP(clientIp);
      const IPArray = IPCache.get(clientIp);
      if (IPArray.length > 1) {
        const rps = IPArray.length / ((IPArray[IPArray.length - 1] - IPArray[0]) * MS_TO_S);
        if (rps > RPS_LIMIT) {
          console.warn(`${clientIp} ${_currentUserInfo} hitting RPS_LIMIT`);
          reportToTelegram(`${clientIp} ${_currentUserInfo} hitting RPS_LIMIT`);
          return reply.response(errorCodes[505]).code(505).takeover();
        }
      }

      updateCacheIP(`HOUR_${clientIp}`, 3600);
      const IPHourArray = IPCache.get(`HOUR_${clientIp}`);
      const REQUEST_LIMIT_PER_HOUR = 3600;
      if (IPHourArray && IPHourArray.length > REQUEST_LIMIT_PER_HOUR) {
        console.warn(`${clientIp} ${_currentUserInfo} hitting REQUEST_LIMIT_PER_HOUR`);
        reportToTelegram(`${clientIp} ${_currentUserInfo} hitting REQUEST_LIMIT_PER_HOUR`);
        return reply.response(errorCodes[505]).code(505).takeover();
      }

      updateCacheIP(`DAY_${clientIp}`, 3600 * 5);
      const REQUEST_LIMIT_PER_DAY = 3600 * 5;
      const IPDayArray = IPCache.get(`DAY_${clientIp}`);
      if (IPDayArray && IPDayArray.length > REQUEST_LIMIT_PER_DAY) {
        console.warn(`${clientIp} ${_currentUserInfo} hitting REQUEST_LIMIT_PER_DAY`);
        reportToTelegram(`${clientIp} ${_currentUserInfo} hitting REQUEST_LIMIT_PER_DAY`);
        return reply.response(errorCodes[505]).code(505).takeover();
      }
    }

    if (!request.currentUser.active) {
      Logger.error(`request.currentUser not active`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //system down then normal user can not use anything, except staff
    if (result.appUserId && MaintainFunctions.getSystemStatus().all === false) {
      Logger.error(`System was down - current active status = ${MaintainFunctions.getSystemStatus().all}`);
      reply.response(errorCodes[599]).code(599).takeover();
      return;
    }

    //recheck again with realtime DB
    if (result.appUserId) {
      let currentUser = await AppUsersResourceAccess.findById(result.appUserId);

      // !!FEATURE 20230221 Tracking hacker IPs
      //store IP & last login
      if (currentUser && (isInvalidStringValue(currentUser.userIpAddress) || currentUser.userIpAddress !== clientIp)) {
        //TODO check performance later
        if (currentUser.username === '0343902960') {
          await AppUsersResourceAccess.updateById(result.appUserId, {
            userIpAddress: clientIp,
          });
        }
      }

      if (currentUser && currentUser.length > 0 && currentUser[0].active) {
        //check token de chi 1 thiet bi active
        const user = currentUser[0];
        const currentToken = request.headers.authorization.replace('Bearer ', '');
        if (user.token != currentToken) {
          Logger.error(`System login by other device | ${user.ipAddress} ${user.lastActiveAt}`);
          reply
            .response({
              statusCode: 401,
              error: 'LOGIN_OTHER_DEVICE',
              message: `${user.ipAddress} | ${user.lastActiveAt}`,
            })
            .code(401)
            .takeover();
          return;
        }
        //append current user to request
        request.currentUser = currentUser[0];
        resolve('ok');
      } else {
        Logger.error(`user.token != currentToken`);
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }
    } else if (result.staffId) {
      let currentStaff = await StaffResourceAccess.findById(result.staffId);

      requestToken = requestToken.replace('Bearer ', '');
      if (currentStaff && currentStaff.token && currentStaff.token !== requestToken) {
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }

      // !!FEATURE 20230221 Tracking hacker IPs
      //store IP & last login
      await StaffResourceAccess.updateById(result.staffId, {
        ipAddress: clientIp,
      });

      if (currentStaff && currentStaff.active) {
        request.currentUser = currentStaff;
        resolve('ok');
      } else {
        console.error(`currentStaff invalid || currentStaff inactive`);
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }
    }
    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyTokenOrAllowEmpty(request, reply) {
  return new Promise(function (resolve) {
    if (request.headers.authorization !== undefined && request.headers.authorization.trim() !== '') {
      let result = token.decodeToken(request.headers.authorization);

      if (result === undefined || (result.appUserId && MaintainFunctions.getSystemStatus().all === false)) {
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }

      //append current user to request
      request.currentUser = result;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyStaffToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;

    if (!currentUser || !currentUser.staffId || currentUser.staffId < 1) {
      Logger.error('do not have staffId or staff id is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser || !currentUser.staffRoleId || currentUser.staffRoleId < 1) {
      Logger.error('do not have staffRoleId or staffRoleId is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    const AGENT_ROLE = 5;
    if (currentUser.roleId === AGENT_ROLE) {
      //if it is agent, reject user
      reply.response(errorCodes[505]).code(505).takeover();
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyAdvanceUserToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;

    if (!currentUser) {
      console.error('user data is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser.appUserId || currentUser.appUserId < 1) {
      console.error('do not have appUserId or appUserId is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser.appUserRoleId || currentUser.appUserRoleId < STATION_ADMIN_ROLE) {
      console.error('User have invalid role');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyAdminToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;

    if (!currentUser.staffId || currentUser.staffId < 1) {
      Logger.error('do not have staffId or staff id is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser.staffRoleId || currentUser.staffRoleId < 1) {
      Logger.error('do not have staffRoleId or staffRoleId is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    const AGENT_ROLE = 5;
    if (currentUser.staffRoleId === AGENT_ROLE) {
      //if it is agent, reject user
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (currentUser.staffRoleId != 1) {
      Logger.error('do not have role admin');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }
    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyAgentToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;

    if (!currentUser.staffId || currentUser.staffId < 1) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser.staffRoleId || currentUser.staffRoleId < 1) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //neu day la agent
    const AGENT_ROLE = 5; //<< agent role luon la ID lon nhat ben trong he thong
    if (currentUser.staffRoleId < AGENT_ROLE) {
      //if it is agent, reject user
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //if agent do not have station
    if (!currentUser.stationsId || currentUser.stationsId <= 0) {
      //if it is agent, reject user
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

//verify token is belong to user or not
//to make sure they can not get info or update other user
async function verifyOwnerToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;
    let userId = request.payload.id;

    if (userId && currentUser.appUserId && userId !== currentUser.appUserId) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}
async function verifyTokenOrAllowEmpty(request, reply) {
  return new Promise(function (resolve) {
    if (request.headers.authorization !== undefined && request.headers.authorization.trim() !== '') {
      let result = token.decodeToken(request.headers.authorization);

      if (result === undefined || (result.appUserId && MaintainFunctions.getSystemStatus().all === false)) {
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }

      //append current user to request
      request.currentUser = result;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyStaffUser(appUserId, staff) {
  if (!staff || !staff.staffRoleId) {
    return 0;
  }
  if (staff.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
    const staffUser = await StaffUserResourceAccess.find(
      {
        appUserId: appUserId,
        staffId: staff.staffId,
      },
      0,
      1,
    );

    if (staffUser && staffUser.length == 0) {
      return 0;
    }
  }
  return 1;
}

async function verifyStationToken(request, reply) {
  new Promise(function (resolve) {
    let result = token.decodeToken(request.headers.authorization);
    //append current user to request
    request.currentUser = result;

    if (request.payload.stationsId === undefined || request.payload.stationsId !== result.stationsId) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }
    if (result === undefined || (result.appUserId && SystemStatus.all === false)) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyPermission(permissionList, appUserRoleId) {
  if (appUserRoleId) {
    const userRole = await AppUserRoleResourceAccess.findById(appUserRoleId);
    if (userRole) {
      const userPermissions = userRole.permissions;
      const isHavePermission = permissionList.some(permission => userPermissions.includes(permission));
      return isHavePermission;
    }
  }
  return false;
}

// Kiểm ra quyền sử dụng các api VR
async function verifyApiKeyVR(request, reply) {
  return new Promise(async function (resolve) {
    const apikeyVR = process.env.SYSTEM_API_KEY;

    let _apiKeyHeaders = request.headers.apikey;
    let _apiKeyParam = request.query.apikey;

    let _apiKey = '';
    if (_apiKeyHeaders) {
      _apiKey = _apiKeyHeaders;
    } else if (_apiKeyParam) {
      _apiKey = _apiKeyParam;
    }

    const requestIp = require('request-ip');
    const clientIp = requestIp.getClientIp(request);

    if (!isNotEmptyStringValue(_apiKey)) {
      await reportToTelegram(`!! someone ${clientIp}  using wrong apikey criminal VR ${_apiKey} !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (_apiKey !== apikeyVR) {
      await reportToTelegram(`!! someone ${clientIp}  using wrong apikey criminal VR ${_apiKey} !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (getListLockIp().includes(clientIp)) {
      await reportToTelegram(`!! blocked ip ${clientIp} try to request api criminal VR !`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

module.exports = {
  isValidUserAccessToken,
  verifyToken,
  verifyAdvanceUserToken,
  verifyStaffToken,
  verifyOwnerToken,
  verifyAdminToken,
  verifyAgentToken,
  verifyTokenOrAllowEmpty,
  verifyStaffUser,
  verifyPermission,
  verifyPartnerApiKey,
  verifySystemApiKey,
  verifyApiKeyVR,
};
