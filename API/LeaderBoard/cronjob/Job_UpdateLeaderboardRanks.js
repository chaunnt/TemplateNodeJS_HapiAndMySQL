"use strict";
const LeaderBoardJob = require("./LeaderBoardJob_RankingForUsers");

let _startTime = new Date() - 1;
console.info(`Start LeaderBoardJob.updateLeaderboardRanks() ${new Date()}`);

LeaderBoardJob.updateLeaderboardRanks();
console.info(`End LeaderBoardJob.updateLeaderboardRanks() ${(new Date() - 1 - _startTime)} ms`);
