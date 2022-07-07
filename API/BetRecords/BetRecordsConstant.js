/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  BET_STATUS: {
    NEW: "New",
    WAITING: "Waiting",
    PENDING: "Pending",
    COMPLETED: "Completed",
    DELETED: "Deleted",
    CANCELED: "Canceled",
  },
  BET_RESULT: {
    WIN: 1,
    LOSE: 0
  },
  BET_TYPE: {
    BIG: 1,
    SMALL: 2,
    ODD: 3,
    EVEN: 4,
    UP: 5,
    DOWN: 6,
    HALF: 7,
    FULL: 8,
    FAC: 10,
    BTC: 20,
  },
  BET_UNIT: {
    BTC: "BTC-USD",
    ETH: "ETH-USD"
  },
  BET_AMOUNT: [
    10000,
    100000,
    200000,
    500000,
    1000000,
    2000000,
    5000000,
    10000000,
    20000000,
    50000000,
    100000000,
    200000000,
    500000000,
  ]
}