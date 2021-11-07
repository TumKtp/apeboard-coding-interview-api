const { promises: fs } = require("fs");
const ERC20Abi = require("../config/abi/erc20.json");
const multicall = require("../utils/multicall");

exports.updateTokenSymbols = async (tokenAddresses) => {
  // Check latest token symbols.
  let rawData;
  try {
    rawData = await fs.readFile("tokenSymbols.json");
  } catch (e) {}
  const tokenSymbols = rawData ? JSON.parse(rawData) : {};

  // Call: All token symbols
  const symbolsCalls = [];
  tokenAddresses = [...new Set(tokenAddresses)];
  for (let i = 0; i < tokenAddresses.length; i++) {
    if (tokenAddresses[i] in tokenSymbols) continue;
    symbolsCalls.push({
      address: tokenAddresses[i],
      name: "symbol",
    });
  }
  const symbols = await multicall(ERC20Abi, symbolsCalls);

  let updated = false;
  for (let i = 0; i < symbolsCalls.length; i++) {
    if (symbolsCalls[i].address in tokenSymbols) continue;
    tokenSymbols[symbolsCalls[i].address] = symbols[i][0];
    updated = true;
  }
  if (updated)
    return await fs.writeFile(
      "tokenSymbols.json",
      JSON.stringify(tokenSymbols)
    );
};
