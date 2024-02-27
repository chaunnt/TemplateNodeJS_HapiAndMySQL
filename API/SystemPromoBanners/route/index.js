/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const SystemPromoBannersRoute = require('./SystemPromoBannersRoute');

module.exports = [
  { method: 'POST', path: '/SystemPromoBanners/insert', config: SystemPromoBannersRoute.insert },
  { method: 'POST', path: '/SystemPromoBanners/find', config: SystemPromoBannersRoute.find },
  { method: 'POST', path: '/SystemPromoBanners/findById', config: SystemPromoBannersRoute.findById },
  { method: 'POST', path: '/SystemPromoBanners/updateById', config: SystemPromoBannersRoute.updateById },
  { method: 'POST', path: '/SystemPromoBanners/deleteById', config: SystemPromoBannersRoute.deleteById },

  { method: 'POST', path: '/SystemPromoBanners/user/getList', config: SystemPromoBannersRoute.userGetList },
  { method: 'POST', path: '/SystemPromoBanners/user/getDetailById', config: SystemPromoBannersRoute.userGetDetailById },
];
