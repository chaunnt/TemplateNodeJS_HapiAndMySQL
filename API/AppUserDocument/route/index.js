/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const AppUserDocument = require('./AppUserDocumentRoute');

module.exports = [
  // { method: 'POST', path: '/AppUserDocument/insert', config: AppUserDocument.insert },
  // { method: 'POST', path: '/AppUserDocument/find', config: AppUserDocument.find },
  // { method: 'POST', path: '/AppUserDocument/updateById', config: AppUserDocument.updateById },
  // { method: 'POST', path: '/AppUserDocument/deleteById', config: AppUserDocument.deleteById },
  // { method: 'POST', path: '/AppUserDocument/findById', config: AppUserDocument.findById },

  { method: 'POST', path: '/AppUserDocument/advanceUser/addDocument', config: AppUserDocument.advanceUserAddDocument },
  { method: 'POST', path: '/AppUserDocument/advanceUser/deleteDocument', config: AppUserDocument.advanceUserDeleteDocument },
];
