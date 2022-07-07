async function createDatabase() {
  //*************CREATE TABLES******************
  //User Modules
  const AppUsersView = require('../API/AppUsers/resourceAccess/AppUserView');
  // const AppUsers = require('../API/AppUsers/resourceAccess/AppUsersResourceAccess');
  // const AppUserMembership = require('../API/AppUserMembership/resourceAccess/AppUserMembershipResourceAccess');
  // await AppUsers.initDB();  // << khi reset user nhớ reset Wallet để nó ra ví tương ứng
  // await AppUserMembership.initDB();
  await AppUsersView.initViews();

  // //User Wallet Modules
  // const Wallet = require('../API/Wallet/resourceAccess/WalletResourceAccess');
  // const WalletBalanceView = require('../API/Wallet/resourceAccess/WalletBalanceUnitView');
  // const WalletBalanceUnit = require('../API/WalletBalanceUnit/resourceAccess/WalletBalanceUnitResourceAccess'); 
  // const WalletRecordResourceAccess = require('../API/WalletRecord/resourceAccess/WalletRecordResoureAccess');
  // const WalletRecordView = require('../API/WalletRecord/resourceAccess/WalletRecordView');

  // await Wallet.initDB();
  // await WalletBalanceUnit.initDB();
  // await WalletRecordResourceAccess.initDB();
  // await WalletBalanceView.initViews();
  // await WalletRecordView.initViews();

  // //User Leaderboard Modules
  // const LeaderBoard = require('../API/LeaderBoard/resourceAccess/LeaderBoardResourAccess');
  // const LeaderBoardUserView = require('../API/LeaderBoard/resourceAccess/LeaderBoardViews');
  // await LeaderBoard.initDB();
  // await LeaderBoardUserView.initViews();

  // //Staff, Roles, Permission modules
  // const Staff = require('../API/Staff/resourceAccess/StaffResourceAccess');
  // const Role = require('../API/Role/resourceAccess/RoleResourceAccess');
  // const RoleStaffView = require('../API/Staff/resourceAccess/RoleStaffView');
  // const Permission = require('../API/Permission/resourceAccess/PermissionResourceAccess');
  // await Permission.initDB();
  // await Role.initDB();
  // await Staff.initDB();
  // await RoleStaffView.initViews();

  // //System & utilities Modules
  // const SystemAppLog = require('../API/SystemAppChangedLog/resourceAccess/SystemAppChangedLogResourceAccess');
  // const UploadResource = require('../API/Upload/resourceAccess/UploadResourceAccess');
  // const SystemConfigurations = require('../API/SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
  // await SystemAppLog.initDB();
  // await UploadResource.initDB();
  // await SystemConfigurations.initDB();

  // //Payment Common modules
  // const PaymentMethod = require('../API/PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
  // const PaymentRecord = require('../API/PaymentRecord/resourceAccess/PaymentRecordResourceAccess');
  // await PaymentMethod.initDB();
  // await PaymentRecord.initDB();


  // //Payment Deposit modules
  // const PaymentDepositResource = require('../API/PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
  const PaymentDepositUserView = require('../API/PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionUserView');
  // const SummaryUserPaymentDepositTransactionView = require('../API/PaymentDepositTransaction/resourceAccess/SummaryUserPaymentDepositTransactionView');
  // await PaymentDepositResource.initDB();
  await PaymentDepositUserView.initViews();
  // await SummaryUserPaymentDepositTransactionView.initViews();

  // //Payment Withdraw modules
  // const PaymentWithdrawResource = require('../API/PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');
  // await PaymentWithdrawResource.initDB();

  // const SummaryUserWithdrawTransactionView = require('../API/PaymentWithdrawTransaction/resourceAccess/SummaryUserWithdrawTransactionView');
  // await SummaryUserWithdrawTransactionView.initViews();

  const WithdrawTransactionUserView = require('../API/PaymentWithdrawTransaction/resourceAccess/WithdrawTransactionUserView');
  await WithdrawTransactionUserView.initViews();

  // //Payment Exchange Modules
  // const PaymentExchangeResource = require('../API/PaymentExchangeTransaction/resourceAccess/PaymentExchangeTransactionResourceAccess');
  // const PaymentExchangeUserView = require('../API/PaymentExchangeTransaction/resourceAccess/ExchangeTransactionUserView');
  // const SummaryUserExchangeTransactionView = require('../API/PaymentExchangeTransaction/resourceAccess/SummaryUserExchangeTransactionView');
  // await PaymentExchangeResource.initDB();
  // await SummaryUserExchangeTransactionView.initViews();
  // await PaymentExchangeUserView.initViews();

  // //Payment Service Package & Bonus package modules
  // const PaymentServicePackage = require('../API/PaymentServicePackage/resourceAccess/PaymentServicePackageResourceAccess');
  // const PaymentServicePackageUserResourceAccess = require('../API/PaymentServicePackage/resourceAccess/PaymentServicePackageUserResourceAccess');
  const ServicePackageUserViews = require('../API/PaymentServicePackage/resourceAccess/ServicePackageUserViews');
  // const ServicePackageWalletViews = require('../API/PaymentServicePackage/resourceAccess/ServicePackageWalletViews');
  // const ServicePackageUnitViews = require('../API/PaymentServicePackage/resourceAccess/PackageUnitView');
  // const SummaryPaymentServicePackageUserView = require('../API/PaymentServicePackage/resourceAccess/SummaryPaymentServicePackageUserView');
  // await PaymentServicePackage.initDB();
  // await PaymentServicePackageUserResourceAccess.initDB();
  await ServicePackageUserViews.initViews();
  // await ServicePackageWalletViews.initViews();
  // await ServicePackageUnitViews.initViews();
  // await SummaryPaymentServicePackageUserView.initViews();

  // const UserBonusPackage = require('../API/PaymentServicePackage/resourceAccess/UserBonusPackageResourceAccess');
  // const UserBonusPackageView = require('../API/PaymentServicePackage/resourceAccess/UserBonusPackageView');

  // await UserBonusPackage.initDB();
  // await UserBonusPackageView.initViews();

  // //Payment Bonus Transaction
  // const PaymentBonusTransactionResource = require('../API/PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionResourceAccess');
  // await PaymentBonusTransactionResource.initDB();

  // const PaymentBonusTransactionUserView = require('../API/PaymentBonusTransaction/resourceAccess/PaymentBonusTransactionUserView');
  // await PaymentBonusTransactionUserView.initViews();

  // const SummaryUserPaymentBonusTransactionView = require('../API/PaymentBonusTransaction/resourceAccess/SummaryUserPaymentBonusTransactionView');
  // await SummaryUserPaymentBonusTransactionView.initViews();

  // //Play Modules
  // const BetRecordsResource = require('../API/BetRecords/resourceAccess/BetRecordsResourceAccess');
  // const UserBetRecordsViews = require('../API/BetRecords/resourceAccess/UserBetRecordsView');

  // await BetRecordsResource.initDB();
  // await UserBetRecordsViews.initViews();

  // const GameBetRecordsView = require('../API/BetRecords/resourceAccess/GameBetRecordsView');
  // await GameBetRecordsView.initViews();

  // //Staking Modules
  // const UserStakingResourceAccess = require('../API/StakingPackage/resourceAccess/StakingPackageUserResourceAccess');
  // const StakingResourceAccess = require('../API/StakingPackage/resourceAccess/StakingPackageResourceAccess');
  // await StakingResourceAccess.initDB();
  // const StakingPackageUserView = require('../API/StakingPackage/resourceAccess/StakingPackageUserView');
  // await UserStakingResourceAccess.initDB();
  // await StakingPackageUserView.initViews();


  // //Message modules
  // const CustomerMessageResourceAccess = require('../API/CustomerMessage/resourceAccess/CustomerMessageResourceAccess');
  // const GroupCustomerMessageResourceAccess = require('../API/CustomerMessage/resourceAccess/GroupCustomerMessageResourceAccess');

  // await CustomerMessageResourceAccess.initDB();
  // await GroupCustomerMessageResourceAccess.initDB();

}
createDatabase();

