const multicall = require("../utils/multicall");
const LpTokenAbi = require("../config/abi/lptoken.json");
exports.fetchTokensOfLpToklen = async (lpAddress) => {
  const calls = [
    { address: lpAddress, name: "token0" },
    { address: lpAddress, name: "token1" },
  ];
  const data = await multicall(LpTokenAbi, calls);

  return data;
};
