const multicall = require("../utils/multicall");
const MasterChefAbi = require("../config/abi/masterchef.json");
const ERC20Abi = require("../config/abi/erc20.json");
const LpTokenAbi = require("../config/abi/lptoken.json");
const { fetchTokensOfLpToklen } = require("./fetchTokensOfLpToklen");
const { getTokenName, getTokenSymbol } = require("../utils/erc20");
const skipPools = require("../config/skipPools");
const { promises: fs } = require("fs");

const { updateTokenSymbols } = require("./updateTokenSymbols");
const { getPoolLength } = require("../utils/masterChef");
const { getMasterChefAddress } = require("../utils/addressHelpers");

exports.fetchPools = async (masterchefAddress) => {
  // Fetch pool length
  const poolLength = await getPoolLength(getMasterChefAddress());
  console.log(poolLength);
  // Call: All pools
  const poolsCalls = [];
  for (let i = 0; i < poolLength; i++) {
    poolsCalls.push({
      address: masterchefAddress,
      name: "poolInfo",
      params: [i],
    });
  }
  let pools = await multicall(MasterChefAbi, poolsCalls);
  pools = pools.map((pool) => pool[0]);

  // Call: Name of lp tokens
  const lpTokenCalls = [];
  for (let i = 0; i < poolLength; i++) {
    if (skipPools.includes(i)) continue;
    lpTokenCalls.push({ address: pools[i], name: "name" });
  }
  const lpTokenName = await multicall(ERC20Abi, lpTokenCalls);

  // Check the number of token in lp token
  const countLpToken = new Array(473);
  let tokenNameIndex = 0;
  for (let i = 0; i < poolLength; i++) {
    if (skipPools.includes(i)) countLpToken[i] = 0;
    else if (lpTokenName[tokenNameIndex++][0] === "Pancake LPs")
      countLpToken[i] = 2;
    else countLpToken[i] = 1;
  }

  // Call: token0, token1 of lp token
  const lpTokenAddressesCalls = [];
  for (let i = 0; i < poolLength; i++) {
    if (countLpToken[i] === 2) {
      lpTokenAddressesCalls.push({ address: pools[i], name: "token0" });
      lpTokenAddressesCalls.push({ address: pools[i], name: "token1" });
    }
  }
  const lpTokenAddresses = await multicall(LpTokenAbi, lpTokenAddressesCalls);
  let lpTokenAddressesIndex = 0;

  // Merge all token addresses
  const allTokenAddresses = [];
  for (let i = 0; i < poolLength; i++) {
    if (countLpToken[i] === 1) allTokenAddresses.push(pools[i]);
    else if (countLpToken[i] === 2) {
      allTokenAddresses.push(lpTokenAddresses[lpTokenAddressesIndex][0]);
      allTokenAddresses.push(lpTokenAddresses[lpTokenAddressesIndex + 1][0]);
      lpTokenAddressesIndex += 2;
    }
  }
  console.log("All token addresses fetched!");
  // Update & Read: token symbol
  console.log("Updaing symbols ...");
  await updateTokenSymbols(allTokenAddresses);
  const rawData = await fs.readFile("tokenSymbols.json");
  console.log("Symbols updated");
  const tokenSymbols = JSON.parse(rawData);

  // Finalize the data
  let tokenIndex = 0;
  const poolInfo = new Array(poolLength);
  for (let i = 0; i < poolLength; i++) {
    if (countLpToken[i] === 1) {
      poolInfo[i] = {
        id: i,
        lpAddress: pools[i],
        token: allTokenAddresses[tokenIndex],
        tokenSymbol: tokenSymbols[allTokenAddresses[tokenIndex]],
      };
      tokenIndex++;
    } else if (countLpToken[i] === 2) {
      poolInfo[i] = {
        id: i,
        lpAddress: pools[i],
        token0: allTokenAddresses[tokenIndex],
        token0Symbol: tokenSymbols[allTokenAddresses[tokenIndex]],
        token1: allTokenAddresses[tokenIndex + 1],
        token1Symbol: tokenSymbols[allTokenAddresses[tokenIndex + 1]],
      };
      tokenIndex += 2;
    } else poolInfo[i] = { id: i, lpAddress: pools[i], error: true };
  }
  return poolInfo;
};

// LEGACY
exports.fetchPoolsV0 = async (masterchefAddress) => {
  const poolLength = 473;
  const poolsCalls = [];
  for (let i = 0; i < poolLength; i++) {
    poolsCalls.push({
      address: masterchefAddress,
      name: "poolInfo",
      params: [i],
    });
  }
  let pools = await multicall(MasterChefAbi, poolsCalls);
  pools = pools.map((pool) => pool[0]);

  const poolInfo = new Array(473);
  for (let i = 0; i < pools.length; i++) {
    if (skipPools.includes(i)) {
      poolInfo[i] = { id: i, lpAddress: pools[i], error: true };
      continue;
    }
    poolInfo[i] = { id: i, lpAddress: pools[i] };
    try {
      const [token0, token1] = await fetchTokensOfLpToklen(pools[i]);
      poolInfo[i]["token0"] = token0[0];
      poolInfo[i]["token1"] = token1[0];
      const token0Symbol = await getTokenSymbol(token0[0]);
      const token1Symbol = await getTokenSymbol(token1[0]);
      poolInfo[i]["token0Symbol"] = token0Symbol;
      poolInfo[i]["token1Symbol"] = token1Symbol;
    } catch (e) {
      poolInfo[i]["token"] = pools[i];
      const tokenSymbol = await getTokenSymbol(pools[i]);
      poolInfo[i]["tokenSymbol"] = tokenSymbol;
    }
  }
  return poolInfo;
};

exports.fetchErrorPools = async (masterchefAddress) => {
  const poolLength = 473;
  const poolsCalls = [];
  for (let i = 0; i < poolLength; i++) {
    poolsCalls.push({
      address: masterchefAddress,
      name: "poolInfo",
      params: [i],
    });
  }
  const pools = await multicall(MasterChefAbi, poolsCalls);
  errorPools = [];
  for (let i = 0; i < pools.length; i++) {
    try {
      const name = await getTokenName(pools[i][0]);
      if (name == "-") throw "error";
    } catch (e) {
      errorPools.push(i);
    }
  }
  return errorPools;
};
