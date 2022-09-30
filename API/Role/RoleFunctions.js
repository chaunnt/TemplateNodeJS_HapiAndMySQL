/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const RoleResourceAccess = require('../resourceAccess/RoleResourceAccess');

async function isValidRole(roleId) {
  let result = await RoleResourceAccess.find({ roleId: roleId });

  if (result && result.length > 0) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  isValidRole,
};
