/* Copyright (c) 2022 Reminano */

const TaskComments = require('./TaskCommentsRoute');

module.exports = [
  { method: 'POST', path: '/TaskComments/insert', config: TaskComments.insert },
  { method: 'POST', path: '/TaskComments/find', config: TaskComments.find },
  { method: 'POST', path: '/TaskComments/updateById', config: TaskComments.updateById },
  { method: 'POST', path: '/TaskComments/deleteById', config: TaskComments.deleteById },
];
