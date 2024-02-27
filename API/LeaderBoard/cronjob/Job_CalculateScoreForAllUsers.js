/* Copyright (c) 2022-2023 Reminano */

'use strict';
const LeaderBoardJob = require('./LeaderBoardJob_RankingForUsers');
const Logger = require('../../../utils/logging');

let _startTime = new Date() - 1;

Logger.info(`Start LeaderBoardJob.calculateScoreForAllUsers() ${new Date()}`);

LeaderBoardJob.calculateScoreForAllUsers();

Logger.info(`End LeaderBoardJob.calculateScoreForAllUsers() ${new Date() - 1 - _startTime} ms`);
