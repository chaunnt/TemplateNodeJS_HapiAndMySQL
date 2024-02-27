/* Copyright (c) 2022-2023 Reminano */

const GamePlayRecords = require('./GamePlayRecordsRoute');

module.exports = [
  //GamePlayRecords APIs
  { method: 'POST', path: '/GamePlayRecords/find', config: GamePlayRecords.find },
  { method: 'POST', path: '/GamePlayRecords/missionPlayHistory', config: GamePlayRecords.getMissionPlayHistory },
  { method: 'POST', path: '/GamePlayRecords/sumTotalSystemBetByDate', config: GamePlayRecords.sumTotalSystemBetByDate },
  { method: 'POST', path: '/GamePlayRecords/user/placeRecord', config: GamePlayRecords.userPlaceBetRecord },
  { method: 'POST', path: '/GamePlayRecords/user/placeRecordTemp', config: GamePlayRecords.userPlaceBetRecordTemp },
  { method: 'POST', path: '/GamePlayRecords/user/placeMissionRecordTemp', config: GamePlayRecords.userPlaceMissionRecordTemp },
  { method: 'POST', path: '/GamePlayRecords/user/cancelAllRecordTemp', config: GamePlayRecords.userCancelAllRecordTemp },
  { method: 'POST', path: '/GamePlayRecords/user/cancelAllMissionRecordTemp', config: GamePlayRecords.userCancelAllMissionRecordTemp },
  { method: 'POST', path: '/GamePlayRecords/user/getListPlayRecord', config: GamePlayRecords.userGetListPlayRecord },
  { method: 'POST', path: '/GamePlayahRecords/user/getTotalBetAmountInByGameId', config: GamePlayRecords.userGetTotalBetAmountInByGameId },
  { method: 'POST', path: '/GamePlayRecords/user/getTotalBetAmountInByBetType', config: GamePlayRecords.userGetTotalBetAmountInByBetType },
  { method: 'POST', path: '/GamePlayRecords/user/getUserPlayAmountByBetType', config: GamePlayRecords.userGetUserPlayAmountByBetType },
  { method: 'POST', path: '/GamePlayRecords/getTotalPlayOfAllRealUserByBetType', config: GamePlayRecords.getTotalPlayOfAllRealUserByBetType },
  {
    method: 'POST',
    path: '/GamePlayRecords/user/userGetUserPlayMissionAmountByBetType',
    config: GamePlayRecords.userGetUserPlayMissionAmountByBetType,
  },
  { method: 'POST', path: '/GamePlayRecords/user/getTotalAmountInByRoom', config: GamePlayRecords.userGetTotalAmountInByRoom },
  { method: 'POST', path: '/GamePlayRecords/user/getTotalAmountWinByRoom', config: GamePlayRecords.userGetTotalAmountWinByRoom },
];
