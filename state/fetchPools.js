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
  // Call: Pool length
  const poolLength = parseInt(await getPoolLength(getMasterChefAddress()));
  console.log("Pool length", poolLength);
  let poolRawData;

  // Check latest pool info.
  try {
    poolRawData = await fs.readFile("poolInfo.json");
  } catch (e) {}
  const latestPoolInfo = poolRawData ? JSON.parse(poolRawData).pools : [];
  const lastestPoolLength = latestPoolInfo.length;
  if (poolLength === lastestPoolLength) {
    console.log("There is no update.");
    return latestPoolInfo;
  }

  // Update current pool info.
  console.log("Updating pool information ...");
  // Call: All pools
  const poolsCalls = [];
  for (let i = lastestPoolLength; i < poolLength; i++) {
    poolsCalls.push({
      address: masterchefAddress,
      name: "poolInfo",
      params: [i],
    });
  }
  let newPools = await multicall(MasterChefAbi, poolsCalls);
  newPools = newPools.map((pool) => pool[0]);

  // Call: Name of lp tokens
  const lpTokenCalls = [];
  for (let i = lastestPoolLength; i < poolLength; i++) {
    if (skipPools.includes(i)) continue;
    lpTokenCalls.push({
      address: newPools[i - lastestPoolLength],
      name: "name",
    });
  }
  const lpTokenName = await multicall(ERC20Abi, lpTokenCalls);

  // Check the number of token in lp token
  const countLpToken = new Array(poolLength);
  let tokenNameIndex = 0;
  for (let i = lastestPoolLength; i < poolLength; i++) {
    if (skipPools.includes(i)) countLpToken[i] = 0;
    else if (lpTokenName[tokenNameIndex++][0] === "Pancake LPs")
      countLpToken[i] = 2;
    else countLpToken[i] = 1;
  }

  // Call: token0, token1 of lp token
  const lpTokenAddressesCalls = [];
  for (let i = lastestPoolLength; i < poolLength; i++) {
    if (countLpToken[i] === 2) {
      lpTokenAddressesCalls.push({
        address: newPools[i - lastestPoolLength],
        name: "token0",
      });
      lpTokenAddressesCalls.push({
        address: newPools[i - lastestPoolLength],
        name: "token1",
      });
    }
  }
  const lpTokenAddresses = await multicall(LpTokenAbi, lpTokenAddressesCalls);
  let lpTokenAddressesIndex = 0;

  // Merge all token addresses
  const allTokenAddresses = [];
  for (let i = lastestPoolLength; i < poolLength; i++) {
    if (countLpToken[i] === 1)
      allTokenAddresses.push(newPools[i - lastestPoolLength]);
    else if (countLpToken[i] === 2) {
      allTokenAddresses.push(lpTokenAddresses[lpTokenAddressesIndex][0]);
      allTokenAddresses.push(lpTokenAddresses[lpTokenAddressesIndex + 1][0]);
      lpTokenAddressesIndex += 2;
    }
  }
  console.log("All token addresses are fetched!");
  // Update & Read: token symbol
  console.log("Updaing symbols ...");
  await updateTokenSymbols(allTokenAddresses);
  const rawData = await fs.readFile("tokenSymbols.json");
  console.log("Symbols updated");
  const tokenSymbols = JSON.parse(rawData);
  console.log(poolLength - lastestPoolLength, "Pools updated");
  // Finalize the data
  let tokenIndex = 0;
  for (let i = lastestPoolLength; i < poolLength; i++) {
    if (countLpToken[i] === 1) {
      latestPoolInfo.push({
        id: i,
        lpAddress: newPools[i - lastestPoolLength],
        token: allTokenAddresses[tokenIndex],
        tokenSymbol: tokenSymbols[allTokenAddresses[tokenIndex]],
      });
      tokenIndex++;
    } else if (countLpToken[i] === 2) {
      latestPoolInfo.push({
        id: i,
        lpAddress: newPools[i - lastestPoolLength],
        token0: allTokenAddresses[tokenIndex],
        token0Symbol: tokenSymbols[allTokenAddresses[tokenIndex]],
        token1: allTokenAddresses[tokenIndex + 1],
        token1Symbol: tokenSymbols[allTokenAddresses[tokenIndex + 1]],
      });
      tokenIndex += 2;
    } else
      latestPoolInfo.push({
        id: i,
        lpAddress: newPools[i - lastestPoolLength],
        error: true,
      });
  }
  await fs.writeFile(
    "poolInfo.json",
    JSON.stringify({ pools: latestPoolInfo })
  );
  return latestPoolInfo;
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
  const poolLength = await getPoolLength(getMasterChefAddress());
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
