/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const CustomerReview = require('./CustomerReviewRoute');

module.exports = [
  { method: 'POST', path: '/CustomerReview/findById', config: CustomerReview.findById },
  { method: 'POST', path: '/CustomerReview/find', config: CustomerReview.find },
  { method: 'POST', path: '/CustomerReview/updateById', config: CustomerReview.updateById },
  { method: 'POST', path: '/CustomerReview/deleteById', config: CustomerReview.deleteById },
  { method: 'POST', path: '/CustomerReview/user/addReview', config: CustomerReview.userAddReview },
];
