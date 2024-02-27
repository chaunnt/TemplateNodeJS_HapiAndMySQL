/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const Joi = require('joi');

const schema = Joi.object({
  bannerUrl1: Joi.string().allow(''),
  bannerUrl2: Joi.string().allow(''),
  bannerUrl3: Joi.string().allow(''),
  bannerUrl4: Joi.string().allow(''),
  bannerUrl5: Joi.string().allow(''),

  linkBanner1: Joi.string().allow(''),
  linkBanner2: Joi.string().allow(''),
  linkBanner3: Joi.string().allow(''),
  linkBanner4: Joi.string().allow(''),
  linkBanner5: Joi.string().allow(''),
});

function fromData(data) {
  let modelData = {
    bannerUrl1: data.bannerUrl1 || '',
    bannerUrl2: data.bannerUrl2 || '',
    bannerUrl3: data.bannerUrl3 || '',
    bannerUrl4: data.bannerUrl4 || '',
    bannerUrl5: data.bannerUrl5 || '',

    linkBanner1: data.linkBanner1 || '',
    linkBanner2: data.linkBanner2 || '',
    linkBanner3: data.linkBanner3 || '',
    linkBanner4: data.linkBanner4 || '',
    linkBanner5: data.linkBanner5 || '',
  };

  let outputModel = schema.validate(modelData);
  if (outputModel.error === undefined || outputModel.error === null || outputModel.error === '') {
    return outputModel.value;
  } else {
    console.error(outputModel.error);
    return undefined;
  }
}

module.exports = {
  fromData,
};
