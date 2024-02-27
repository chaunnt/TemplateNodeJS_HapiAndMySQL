/* Copyright (c) 2022-2023 Reminano */

'use strict';
const LeaderBoardJob = require('./LeaderBoardJob_RankingForUsers');
const Logger = require('../../../utils/logging');

let _startTime = new Date() - 1;
Logger.info(`Start LeaderBoardJob.updateLeaderboardRanks() ${new Date()}`);

LeaderBoardJob.updateLeaderboardRanks();
Logger.info(`End LeaderBoardJob.updateLeaderboardRanks() ${new Date() - 1 - _startTime} ms`);
