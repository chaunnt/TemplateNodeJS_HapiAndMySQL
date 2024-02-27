/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const token = require('../ApiUtils/token');
const MaintainFunctions = require('../Maintain/MaintainFunctions');
const errorCodes = require('./route/response').errorCodes;
const UserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const StaffResource = require('../Staff/resourceAccess/RoleStaffView');
const Logger = require('../../utils/logging');
const StaffUserResourceAccess = require('../StaffUser/resourceAccess/StaffUserResourceAccess');
const { ROLE_NAME } = require('../StaffRole/StaffRoleConstants');
const moment = require('moment');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

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
    //if there is no token or empty token
    if (!(request.headers.authorization && request.headers.authorization !== '')) {
      Logger.error(`System was down - current active status = ${MaintainFunctions.getSystemStatus().all}`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    let result = isValidUserAccessToken(request.headers.authorization);

    //invalid token
    if (result === undefined) {
      Logger.error(`invalid token`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //append current user to request
    request.currentUser = result;

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
      let currentUser = await UserResource.find({
        appUserId: result.appUserId,
      });
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
      let currentStaff = await StaffResource.find({ staffId: result.staffId });
      if (currentStaff && currentStaff.length > 0 && currentStaff[0].active) {
        //append current user to request
        request.currentUser = currentStaff[0];

        //do not allow multiple staff login
        //if (currentStaff[0].staffToken !== request.headers.authorization.replace('Bearer ','')) {
        //  reply.response(errorCodes[505]).code(505).takeover();
        //  return
        //}
        resolve('ok');
      } else {
        Logger.error(`currentStaff && currentStaff.length > 0 && currentStaff[0].active`);
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

module.exports = {
  isValidUserAccessToken,
  verifyToken,
  verifyStaffToken,
  verifyOwnerToken,
  verifyAdminToken,
  verifyAgentToken,
  verifyTokenOrAllowEmpty,
  verifyStaffUser,
};
