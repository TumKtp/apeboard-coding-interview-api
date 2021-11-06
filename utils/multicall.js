const { Interface } = require("@ethersproject/abi");
const { getWeb3 } = require("./web3");
const MultiCallAbi = require("../config/abi/multicall.json");
const { getMulticallAddress } = require("./addressHelpers");

const multicall = async (abi, calls) => {
  const web3 = getWeb3();
  const multi = new web3.eth.Contract(MultiCallAbi, getMulticallAddress());

  const itf = new Interface(abi);

  const calldata = calls.map((call) => [
    call.address.toLowerCase(),
    itf.encodeFunctionData(call.name, call.params),
  ]);
  const { returnData } = await multi.methods.aggregate(calldata).call();
  const res = returnData.map((call, i) =>
    itf.decodeFunctionResult(calls[i].name, call)
  );

  return res;
};

module.exports = multicall;
