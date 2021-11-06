const MasterChefAbi = require("../config/abi/masterchef.json");
const { getWeb3 } = require("./web3");

exports.getPoolLength = async (masterChefAddress) => {
  const web3 = getWeb3();
  try {
    const contract = new web3.eth.Contract(MasterChefAbi, masterChefAddress);
    const poolLength = await contract.methods.poolLength().call();
    return poolLength;
  } catch (e) {
    return "-";
  }
};
