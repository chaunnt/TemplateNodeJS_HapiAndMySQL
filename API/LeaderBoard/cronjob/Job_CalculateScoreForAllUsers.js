"use strict";
const LeaderBoardJob = require("./LeaderBoardJob_RankingForUsers");

let _startTime = new Date() - 1;

console.info(`Start LeaderBoardJob.calculateScoreForAllUsers() ${new Date()}`);

LeaderBoardJob.calculateScoreForAllUsers();

console.info(`End LeaderBoardJob.calculateScoreForAllUsers() ${(new Date() - 1 - _startTime)} ms`);
