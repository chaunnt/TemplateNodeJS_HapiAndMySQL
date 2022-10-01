/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const ProductOrderResourceAccess = require('../resourceAccess/ProductOrderResourceAccess');
const Logger = require('../../../utils/logging');
const ProductOrderFunctions = require('../ProductOrderFunctions');
const { PLACE_ORDER_ERROR } = require('../ProductOrderConstant');

const { ERROR } = require('../../Common/CommonConstant');

const { payBonusForReferralUsers } = require('../../PaymentBonusTransaction/UserPaymentBonusFunctions');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let productOrderData = req.payload;
      let result = await ProductOrderResourceAccess.insert(productOrderData);
      if (result) {
        resolve(result);
      } else {
        console.error(`error product Order can not insert: ${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      if (filter === undefined) {
        filter = {};
      }
      let productOrders = await ProductOrderFunctions.getProductOrderList(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        searchText,
        order,
      );

      if (productOrders) {
        let productOrdersCount = await ProductOrderResourceAccess.customCount(
          filter,
          undefined,
          undefined,
          startDate,
          endDate,
          searchText,
          order,
        );

        resolve({ data: productOrders, total: productOrdersCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let productOrderId = req.payload.id;
      let productOrderData = req.payload.data;
      let result = await ProductOrderResourceAccess.updateById(productOrderId, productOrderData);
      if (result) {
        resolve(result);
      } else {
        console.error(`error product Order updateById with productOrderId ${productOrderId}: ${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let productOrderId = req.payload.id;
      let result = await ProductOrderFunctions.getOrderDetail({ productOrderId: productOrderId });
      if (result && result.length > 0) {
        resolve(result[0]);
      } else {
        console.error(`error product Order findById with productOrderId ${productOrderId}: ${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userFindById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let productOrderId = req.payload.id;
      let appUserId = req.currentUser.appUserId;
      let result = await ProductOrderFunctions.getOrderDetail({ productOrderId: productOrderId, appUserId: appUserId });
      if (result && result.length > 0) {
        resolve(result[0]);
      } else {
        console.error(`error product Order userFindById with productOrderId ${productOrderId}: ${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await ProductOrderResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      }
      console.error(`error product Order deleteById with id ${id}: ${ERROR}`);
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      let appUserId = req.currentUser.appUserId;

      if (filter === undefined) {
        filter = {};
      }
      filter.appUserId = appUserId;

      let productOrders = await ProductOrderFunctions.getProductOrderList(
        filter,
        skip,
        limit,
        startDate,
        endDate,
        searchText,
        order,
      );

      if (productOrders && productOrders.length > 0) {
        let productOrdersCount = await ProductOrderResourceAccess.customCount(
          filter,
          undefined,
          undefined,
          startDate,
          endDate,
          searchText,
          order,
        );
        resolve({ data: productOrders, total: productOrdersCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userPlaceOrder(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let productData = req.payload;
      let _currentUser = req.currentUser;
      let result = await ProductOrderFunctions.placeNewOrder(_currentUser, productData);
      if (result) {
        const _newOrderId = result;
        let _orderDetail = await ProductOrderResourceAccess.findById(_newOrderId);
        if (_orderDetail) {
          payBonusForReferralUsers(_currentUser, _orderDetail.subTotal);
        }

        resolve(result);
      } else {
        console.error(`error product Order userPlaceOrder with userId ${_currentUser.appUserId}: ${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      if (e === PLACE_ORDER_ERROR.FAILED) {
        console.error(`error product Order userPlaceOrder: ${PLACE_ORDER_ERROR.FAILED}`);
        reject(PLACE_ORDER_ERROR.FAILED);
      } else {
        console.error(`error product Order userPlaceOrder`, e);
        reject(e);
      }
    }
  });
}

async function userPrecheckOrder(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let productData = req.payload;
      let orderInquery = await ProductOrderFunctions.verifyOrderData(productData);
      if (orderInquery) {
        resolve(orderInquery);
      } else {
        console.error(`error product Order userPrecheckOrder: ${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      if (e === PLACE_ORDER_ERROR.FAILED) {
        console.error(`error product Order userPrecheckOrder: ${PLACE_ORDER_ERROR.FAILED}`);
        reject(PLACE_ORDER_ERROR.FAILED);
      } else if (e === PLACE_ORDER_ERROR.MUST_UNIQUE_TICKET_ID) {
        console.error(`error product Order userPrecheckOrder: ${PLACE_ORDER_ERROR.MUST_UNIQUE_TICKET_ID}`);
        reject(PLACE_ORDER_ERROR.MUST_UNIQUE_TICKET_ID);
      } else if (e === PLACE_ORDER_ERROR.NOT_RIGHT) {
        console.error(`error product Order userPrecheckOrder: ${PLACE_ORDER_ERROR.NOT_RIGHT}`);
        reject(PLACE_ORDER_ERROR.NOT_RIGHT);
      } else {
        console.error(`error product Order userPrecheckOrder`, e);
        reject(e);
      }
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  getList,
  userPlaceOrder,
  userPrecheckOrder,
  userFindById,
};
