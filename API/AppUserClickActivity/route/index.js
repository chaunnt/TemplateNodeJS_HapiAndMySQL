/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserClickActivity = require('./AppUserClickActivityRoute');

module.exports = [{ method: 'POST', path: '/AppUserClickActivity/user/clickActivity', config: AppUserClickActivity.userClickActivity }];
