const BigNumber = require("bignumber.js");
exports.getBalanceNumber = (balance, decimals = 18) => {
  const displayBalance = new BigNumber(balance).dividedBy(
    new BigNumber(10).pow(decimals)
  );
  return displayBalance.toNumber();
};
