const addresses = require("../config/contracts");

exports.getMulticallAddress = () => {
  return addresses.mulltiCall;
};

exports.getMasterChefAddress = () => {
  return addresses.masterChef;
};
