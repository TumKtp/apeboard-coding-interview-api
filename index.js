const express = require("express");
const { fetchPools, fetchErrorPools } = require("./state/fetchPools");
const { fetchUserStakedAmount } = require("./state/fetchUserStakedAmount");
const { getMasterChefAddress } = require("./utils/addressHelpers");
const app = express();

// Routes
app.get("/pancakeswap/pools", async (_, res) => {
  const pools = await fetchPools(getMasterChefAddress());
  return res.json({
    pools,
  });
});

app.get("/pancakeswap/:userAddress", async (req, res) => {
  const { userAddress } = req.params;
  const user = await fetchUserStakedAmount(getMasterChefAddress(), userAddress);
  return res.json({
    user,
  });
});

app.get("/pancakeswap/pools/error", async (_, res) => {
  const errorPools = await fetchErrorPools(getMasterChefAddress());
  return res.json({
    errorPools,
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
