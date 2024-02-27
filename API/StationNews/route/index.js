/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationNews = require('./StationNewsRoute');

module.exports = [
  { method: 'POST', path: '/StationNews/insert', config: StationNews.insert },
  { method: 'POST', path: '/StationNews/getList', config: StationNews.find },
  { method: 'POST', path: '/StationNews/updateById', config: StationNews.updateById },
  { method: 'POST', path: '/StationNews/getNewsList', config: StationNews.stationNewsList },
  { method: 'POST', path: '/StationNews/user/getNewestList', config: StationNews.stationNewestList },
  { method: 'POST', path: '/StationNews/getNewsDetail', config: StationNews.stationNewsDetail },
  { method: 'POST', path: '/StationNews/deleteById', config: StationNews.deleteById },
  // { method: 'POST', path: '/StationNews/getHotNewsList', config: StationNews.stationHotNewsList }, // Hiện tại chưa được sử dụng
  // { method: 'POST', path: '/StationNews/getDetailById', config: StationNews.findById }, // Hiện tại chưa được sử dụng

  { method: 'POST', path: '/StationNews/user/increaseShare', config: StationNews.increaseShare },
  { method: 'POST', path: '/StationNews/user/getExpertNews', config: StationNews.getExpertNews },
  { method: 'POST', path: '/StationNews/user/getRecruitmentNews', config: StationNews.getRecruitmentNews },
  { method: 'POST', path: '/StationNews/user/getHighLightNews', config: StationNews.getHighLightNews },
  { method: 'POST', path: '/StationNews/user/getPartnerPromotionNews', config: StationNews.getPartnerPromotionNews },
  { method: 'POST', path: '/StationNews/user/getPartnerUtilityNews', config: StationNews.getPartnerUtilityNews },
  // { method: 'POST', path: '/StationNews/user/stationAllNews', config: StationNews.stationAllNews }, // Hiện tại chưa được sử dụng

  { method: 'POST', path: '/StationNews/advanceUser/getNewsDetail', config: StationNews.advanceUserGetNewsDetail },
  { method: 'POST', path: '/StationNews/advanceUser/getDetailById', config: StationNews.advanceUserGetDetail },
  { method: 'POST', path: '/StationNews/advanceUser/updateById', config: StationNews.advanceUserUpdateNews },
  { method: 'POST', path: '/StationNews/advanceUser/addNews', config: StationNews.advanceUserAddNews },
  { method: 'POST', path: '/StationNews/advanceUser/getHotNewsList', config: StationNews.advanceUserGetHotNewsList },
  { method: 'POST', path: '/StationNews/advanceUser/getList', config: StationNews.advanceUserGetList },
  { method: 'POST', path: '/StationNews/advanceUser/getNewsList', config: StationNews.advanceUserGetNewsList },
  { method: 'POST', path: '/StationNews/advanceUser/deleteById', config: StationNews.advanceUserDeleteNew },
];
