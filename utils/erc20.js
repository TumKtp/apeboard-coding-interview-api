const { getWeb3 } = require("./web3");
const ERC20Abi = require("../config/abi/erc20.json");

exports.getTokenSymbol = async (tokenAddress) => {
  const web3 = getWeb3();

  try {
    const contract = new web3.eth.Contract(ERC20Abi, tokenAddress);
    const symbol = await contract.methods.symbol().call();
    return symbol;
  } catch (e) {
    return "-";
  }
};

exports.getTokenName = async (tokenAddress) => {
  const web3 = getWeb3();

  try {
    const contract = new web3.eth.Contract(ERC20Abi, tokenAddress);
    const name = await contract.methods.name().call();
    return name;
  } catch (e) {
    return "-";
  }
};
