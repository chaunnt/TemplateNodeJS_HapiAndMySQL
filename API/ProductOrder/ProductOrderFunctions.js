/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const moment = require('moment');

const ProductOrderResourceAccess = require('../ProductOrder/resourceAccess/ProductOrderResourceAccess');
const ProductOrderUserViews = require('../ProductOrder/resourceAccess/ProductOrderUserViews');
const ProductOrderItemResourceAccess = require('../ProductOrderItem/resourceAccess/ProductOrderItemResourceAccess');
const WalletResourceAccess = require('../Wallet/resourceAccess/WalletResourceAccess');
const ProductResourceAccess = require('../Product/resourceAccess/ProductResourceAccess');
const ProductOrderItemsView = require('../ProductOrderItem/resourceAccess/ProductOrderItemsView');
const BetRecordsResourceAccess = require('../BetRecords/resourceAccess/BetRecordsResourceAccess');
const ProductImageResourceAccess = require('../ProductImage/resourceAccess/ProductImageResourceAccess');
const WalletRecordFunctions = require('../WalletRecord/WalletRecordFunction');
const Logger = require('../../utils/logging');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');
const { PLACE_ORDER_ERROR, PRODUCT_ORDER_STATUS } = require('./ProductOrderConstant');

async function retrieveAllUserWallets(user) {
  const userWallet = await WalletResourceAccess.find({ appUserId: user.appUserId });

  if (!userWallet || userWallet.length < 1) {
    Logger.error(`invalid wallet for user ${user.appUserId}`);
    return undefined;
  }

  let rewardWallet; // ví hoa hồng
  let bonusWallet; // ví khuyến mãi
  let pointWallet; // vi tiền chính của user

  for (const _wallet of userWallet) {
    if (_wallet.walletType === WALLET_TYPE.REWARD) {
      rewardWallet = _wallet;
      continue;
    }

    if (_wallet.walletType === WALLET_TYPE.BONUS) {
      bonusWallet = _wallet;
      continue;
    }

    if (_wallet.walletType === WALLET_TYPE.POINT) {
      pointWallet = _wallet;
      continue;
    }
    continue;
  }

  if (!rewardWallet || !bonusWallet || !pointWallet) {
    Logger.error(PLACE_ORDER_ERROR.INVALID_WALLET);
    reject(PLACE_ORDER_ERROR.INVALID_WALLET);
    return undefined;
  }
  return {
    rewardWallet,
    pointWallet,
    bonusWallet,
  };
}

async function _calculateOrderInqueries(orderData) {
  let _orderProductItems = orderData.orderProductItems;
  let _subTotal = 0;
  let _total = 0;
  let _fee = 0;

  for (let i = 0; i < _orderProductItems.length; i++) {
    let _productItem = await ProductResourceAccess.findById(_orderProductItems[i].productId);
    if (!_productItem) {
      console.error(`_calculateOrderInqueries failed, can not find product id ${_orderProductItems[i].productId}`);
      return undefined;
    }
    _subTotal += _productItem.price * _orderProductItems[i].orderItemQuantity;
    _orderProductItems[i].orderItemPrice = _productItem.price;
    _orderProductItems[i].stockQuantity = _productItem.stockQuantity;
  }
  const PURCHASE_FEE_PERCENTAGE = 5; //5% phi giao dich
  _fee = (_subTotal * PURCHASE_FEE_PERCENTAGE) / 100;
  _total = _subTotal + _fee;

  return {
    total: _total,
    fee: _fee,
    subTotal: _subTotal,
    orderProductItems: _orderProductItems,
  };
}

async function verifyOrderData(orderData) {
  let orderProductItems = orderData.orderProductItems;

  //kiểm tra đơn hàng, tránh đặt trùng mã sản phẩm
  const productIds = orderProductItems.map(_orderProductItem => _orderProductItem.productId);
  const uniqueProductId = [...new Set(productIds)];

  if (uniqueProductId && productIds && uniqueProductId.length !== productIds.length) {
    Logger.error(PLACE_ORDER_ERROR.MUST_UNIQUE_TICKET_ID);
    throw PLACE_ORDER_ERROR.MUST_UNIQUE_TICKET_ID;
  }

  //tính toán tiền đơn hàng
  const orderInquery = await _calculateOrderInqueries(orderData);
  if (!orderInquery) {
    Logger.error(PLACE_ORDER_ERROR.NOT_RIGHT);
    throw PLACE_ORDER_ERROR.NOT_RIGHT;
  }

  orderProductItems = orderInquery.orderProductItems;

  return orderInquery;
}

async function storeOrderItemToDb(orderId, orderItem) {
  let __newOrderItemId = await ProductOrderItemResourceAccess.insert({
    orderItemPrice: orderItem.orderItemPrice,
    orderItemQuantity: orderItem.orderItemQuantity,
    productId: orderItem.productId,
    productOrderId: orderId,
  });
  //attach Product image for each order item
  const ProductImageResource = require('../ProductImage/resourceAccess/ProductImageResourceAccess');
  const { PRODUCT_IMAGE_STATUS } = require('../ProductImage/ProductImageConstant');
  let orderItemQuantity = orderItem.orderItemQuantity;
  let _validImages = await ProductImageResource.find(
    {
      productId: orderItem.productId,
      productOrderId: null,
    },
    0,
    orderItemQuantity,
  );

  if (_validImages && _validImages.length > 0 && _validImages.length === orderItemQuantity) {
    _validImages.forEach(async productImage => {
      await ProductImageResource.updateById(productImage.productImageId, {
        productOrderId: orderId,
        productOrderItemId: __newOrderItemId,
        productImageStatus: PRODUCT_IMAGE_STATUS.COMPLETED,
      });
    });
  }

  return __newOrderItemId;
}

async function placeNewOrder(user, orderData) {
  let orderProductItems = orderData.orderProductItems;

  //kiem tra don hang va tinh toan tien don hang
  const orderInquery = await verifyOrderData(orderData);
  orderProductItems = orderInquery.orderProductItems;

  //kiem tra so luong ton kho
  for (const _orderItem of orderProductItems) {
    if (_orderItem.orderItemQuantity > _orderItem.stockQuantity) {
      Logger.error(PLACE_ORDER_ERROR.PRODUCT_OUT_OF_STOCK);
      throw PLACE_ORDER_ERROR.PRODUCT_OUT_OF_STOCK;
    }
  }

  // Ví khuyến mãi -> ví chính -> ví Thưởng ,kiểm tra cả 3 ví đủ tổng số dư là được
  const { bonusWallet, pointWallet, rewardWallet } = await retrieveAllUserWallets(user);

  let walletSumRecordAmountInOut = await Promise.all([
    WalletRecordFunctions.checkSumWalletById(rewardWallet.walletId, user.appUserId),
    WalletRecordFunctions.checkSumWalletById(pointWallet.walletId, user.appUserId),
    WalletRecordFunctions.checkSumWalletById(bonusWallet.walletId, user.appUserId),
  ]);

  const [rewardAmount, bonusAmount, pointAmount] = walletSumRecordAmountInOut;
  const isEnoughtMoney = rewardAmount + bonusAmount + pointAmount - orderInquery.total >= 0;
  if (!isEnoughtMoney) {
    Logger.error(PLACE_ORDER_ERROR.NOT_ENOUGHT_MONEY);
    throw PLACE_ORDER_ERROR.NOT_ENOUGHT_MONEY;
  }

  //tao du lieu don hang moi
  const _newOrderData = {
    subTotal: orderInquery.subTotal,
    total: orderInquery.total,
    fee: orderInquery.fee,
    customerName: user.firstName + ' ' + user.lastName,
    customerPhone: user.phoneNumber,
    customerIdentity: user.identityNumber,
    appUserId: user.appUserId,
    orderStatus: PRODUCT_ORDER_STATUS.COMPLETED,
  };

  //tao du lieu thanh toan
  let totalBalance = orderInquery.total;

  let decrementBonusWallet = bonusWallet.balance > totalBalance ? totalBalance : bonusWallet.balance;
  // nêú ví cớ cớ 100k mà tiền là 0k totalBalance = 0k
  totalBalance = totalBalance - decrementBonusWallet; // 0k - 0k

  let decrementPointWallet = pointWallet.balance > totalBalance ? totalBalance : pointWallet.balance;
  // tương tự
  totalBalance = totalBalance - decrementPointWallet;

  let decrementRewardWallet = rewardWallet.balance > totalBalance ? totalBalance : rewardWallet.balance;
  // nêú ví cớ cớ 100k mà tiền là 80k totalBalance = 80k
  totalBalance = totalBalance - decrementRewardWallet; // 80k - 80k = 0

  //thực thi thanh toán và tạo đơn hàng

  const { WALLET_RECORD_TYPE } = require('../WalletRecord/WalletRecordConstant');
  let placeOrderResult = await Promise.all([
    ProductOrderResourceAccess.insert(_newOrderData),

    WalletRecordFunctions.decreaseBalance(
      user.appUserId,
      bonusWallet.walletType,
      WALLET_RECORD_TYPE.MAKE_PAYMENT,
      decrementBonusWallet,
    ),
    WalletRecordFunctions.decreaseBalance(
      user.appUserId,
      pointWallet.walletType,
      WALLET_RECORD_TYPE.MAKE_PAYMENT,
      decrementPointWallet,
    ),
    WalletRecordFunctions.decreaseBalance(
      user.appUserId,
      rewardWallet.walletType,
      WALLET_RECORD_TYPE.MAKE_PAYMENT,
      decrementRewardWallet,
    ),
  ]);

  if (placeOrderResult.length !== 4) {
    console.error(`Place order error`);
    console.error(JSON.stringify(orderData));
    console.error(JSON.stringify(_newOrderData));
    console.error(placeOrderResult);
  }

  const newOrderId = placeOrderResult[0][0];

  //reduce storage quantity
  const productsPromiseList = [];
  const createBetRecordPromise = [];
  for (const _orderItem of orderProductItems) {
    const __newOrderItemId = await storeOrderItemToDb(newOrderId, _orderItem);

    if (_orderItem.orderItemQuantity <= _orderItem.stockQuantity) {
      const product = await ProductResourceAccess.findById(_orderItem.productId);
      let newSection = moment(product.expireDate).format('YYYYMMDD');
      let gameRecordSection = `${product.productChannel}_${newSection}`;
      createBetRecordPromise.push({
        appUserId: user.appUserId,
        betRecordSection: gameRecordSection,
        betRecordType: product.productType,
        betRecordAmountIn: product.price,
        betRecordValue: product.producName,
        walletId: rewardWallet.walletId,
        betRecordQuantity: _orderItem.orderItemQuantity,
        productId: _orderItem.productId,
        productOrderId: newOrderId,
        productOrderItemId: __newOrderItemId[0],
      });

      productsPromiseList.push(
        ProductResourceAccess.updateById(_orderItem.productId, {
          stockQuantity: _orderItem.stockQuantity - _orderItem.orderItemQuantity,
        }),
      );
    }
  }

  await Promise.all(productsPromiseList, BetRecordsResourceAccess.insert(createBetRecordPromise));

  return newOrderId;
}

async function getProductOrderList(filter, skip, limit, startDate, endDate, searchText, order) {
  const productOrders = await ProductOrderUserViews.customSearch(
    filter,
    skip,
    limit,
    startDate,
    endDate,
    searchText,
    order,
  );

  for (const _productOrder of productOrders) {
    let productOrderId = _productOrder.productOrderId;

    let _productImages = await ProductImageResourceAccess.customSearch({
      productOrderId: productOrderId,
    });
    let listProductImages = [];
    if (_productImages) {
      _productImages.forEach(productImage => listProductImages.push(productImage.productImageUrl));
    }
    _productOrder.productImage = listProductImages;

    const productOrderItems = await ProductOrderItemsView.customSearch({
      productOrderId: productOrderId,
    });
    _productOrder.productOrderItems = productOrderItems;
  }

  return productOrders;
}

async function getOrderDetail(filter) {
  const productOrder = await ProductOrderUserViews.customSearch(filter);

  if (!productOrder[0] || !productOrder) {
    return undefined;
  }

  let _productOrderItems = await ProductOrderItemsView.customSearch({
    productOrderId: filter.productOrderId,
  });

  const ProductImage = require('../ProductImage/resourceAccess/ProductImageResourceAccess');
  for (let i = 0; i < _productOrderItems.length; i++) {
    const _item = _productOrderItems[i];
    let _productImage = await ProductImage.customSearch({
      productOrderItemId: _item.productOrderItemId,
    });
    if (_productImage) {
      _productOrderItems[i].productImages = _productImage;
    }
  }
  productOrder[0].productOrderItems = _productOrderItems;
  return productOrder;
}

module.exports = {
  placeNewOrder,
  verifyOrderData,
  getOrderDetail,
  getProductOrderList,
};
