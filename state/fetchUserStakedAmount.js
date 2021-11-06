const multicall = require("../utils/multicall");
const MasterChefAbi = require("../config/abi/masterchef.json");

const { getPoolLength } = require("../utils/masterChef");
const { getMasterChefAddress } = require("../utils/addressHelpers");
const { fetchPools } = require("./fetchPools");

exports.fetchUserStakedAmount = async (masterchefAddress, userAddress) => {
  // Call: Pool length
  const poolLength = await getPoolLength(getMasterChefAddress());

  // Call: Staked amount of all pools
  const stakedAmountCalls = [];
  for (let i = 0; i < poolLength; i++) {
    stakedAmountCalls.push({
      address: masterchefAddress,
      name: "userInfo",
      params: [i, userAddress],
    });
  }
  const stakedAmount = await multicall(MasterChefAbi, stakedAmountCalls);
  const userInfo = [];
  for (let i = 0; i < stakedAmount.length; i++) {
    if (stakedAmount[i][0] != 0)
      userInfo.push({
        id: i,
        amount: stakedAmount[i][0].toString(),
      });
  }

  // Call: Pending cake of staked pool
  const pendingCakesCalls = [];
  for (let i = 0; i < userInfo.length; i++) {
    pendingCakesCalls.push({
      address: masterchefAddress,
      name: "pendingCake",
      params: [userInfo[i].id, userAddress],
    });
  }
  const pendingCakes = await multicall(MasterChefAbi, pendingCakesCalls);
  for (let i = 0; i < userInfo.length; i++) {
    userInfo[i]["reward"] = pendingCakes[i][0].toString();
  }
  const poolInfo = await fetchPools(getMasterChefAddress());

  // Finalize the data
  for (let i = 0; i < userInfo.length; i++) {
    poolInfo.map((pool) => {
      if (pool.id == userInfo[i].id) {
        userInfo[i] = { ...userInfo[i], ...pool };
      }
    });
  }
  return userInfo;
};
