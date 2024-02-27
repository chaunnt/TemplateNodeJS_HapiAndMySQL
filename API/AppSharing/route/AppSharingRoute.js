/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moduleName = 'AppSharing';
const { shareStationNew, shareStation } = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
module.exports = {
  shareStationNew: {
    tags: ['api', `${moduleName}`],
    description: `share station new ${moduleName}`,
    validate: {
      params: {
        stationNewsId: Joi.number().required().min(0),
      },
    },
    handler: function (req, res) {
      shareStationNew(req, res);
    },
  },

  shareStation: {
    tags: ['api', `${moduleName}`],
    description: `share station ${moduleName}`,
    validate: {
      params: {
        stationCode: Joi.string().required().min(0),
      },
    },
    handler: function (req, res) {
      shareStation(req, res);
    },
  },
};
