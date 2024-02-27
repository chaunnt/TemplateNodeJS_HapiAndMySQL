/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationDocument = require('./StationDocumentRoute');
const StationDocumentFile = require('./StationDocumentFileRoute');
const StationDocumentRoute_AdvanceUser = require('./StationDocumentRoute_AdvanceUser');

module.exports = [
  { method: 'POST', path: '/StationDocument/insert', config: StationDocument.insert },
  { method: 'POST', path: '/StationDocument/find', config: StationDocument.find },
  { method: 'POST', path: '/StationDocument/findById', config: StationDocument.findById },
  { method: 'POST', path: '/StationDocument/updateById', config: StationDocument.updateById },
  { method: 'POST', path: '/StationDocument/uploadDocumentForStation', config: StationDocument.adminUploadDocumentForStation },
  { method: 'POST', path: '/StationDocument/deleteById', config: StationDocument.deleteById },
  { method: 'POST', path: '/StationDocument/listStationsNotView', config: StationDocument.getListStationsNotView },
  { method: 'POST', path: '/StationDocumentFile/insert', config: StationDocumentFile.insert },
  { method: 'POST', path: '/StationDocumentFile/updateById', config: StationDocumentFile.updateById },
  { method: 'POST', path: '/StationDocumentFile/deleteById', config: StationDocumentFile.deleteById },

  //API danh cho nhan vien tram
  {
    method: 'POST',
    path: '/StationDocument/advanceUser/getListStationDocument',
    config: StationDocumentRoute_AdvanceUser.advanceUserGetListDocument,
  },
  { method: 'POST', path: '/StationDocument/advanceUser/getListDocument', config: StationDocumentRoute_AdvanceUser.advanceUserGetAdminDocument },
  { method: 'POST', path: '/StationDocument/advanceUser/getDetailDocument', config: StationDocumentRoute_AdvanceUser.advanceUserGetDetailDocument },
  { method: 'POST', path: '/StationDocument/advanceUser/uploadDocument', config: StationDocumentRoute_AdvanceUser.advanceUserAddDocument },
  { method: 'POST', path: '/StationDocument/advanceUser/removeDocument', config: StationDocumentRoute_AdvanceUser.advanceUserRemoveDocument },
  { method: 'POST', path: '/StationDocument/advanceUser/updateDocument', config: StationDocumentRoute_AdvanceUser.advanceUserUpdateDocument },
];
