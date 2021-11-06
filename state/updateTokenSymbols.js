const { getTokenSymbol } = require("../utils/erc20");
const { promises: fs } = require("fs");

exports.updateTokenSymbols = async (tokenAddresses) => {
  let rawData;
  try {
    rawData = await fs.readFile("tokenSymbols.json");
  } catch (e) {}
  const tokenSymbols = rawData ? JSON.parse(rawData) : {};
  let updated = false;
  for (let i = 0; i < tokenAddresses.length; i++) {
    if (tokenAddresses[i] in tokenSymbols) continue;
    updated = true;
    const symbol = await getTokenSymbol(tokenAddresses[i]);
    tokenSymbols[tokenAddresses[i]] = symbol;
  }
  if (updated)
    return await fs.writeFile(
      "tokenSymbols.json",
      JSON.stringify(tokenSymbols)
    );
};
