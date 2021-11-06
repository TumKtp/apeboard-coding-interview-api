const express = require("express");
const {
  fetchPools,
  fetchErrorPools,
  fetchPoolsV0,
} = require("./state/fetchPools");
const { getMasterChefAddress } = require("./utils/addressHelpers");
const { getTokenName } = require("./utils/erc20");
const app = express();
// Middlewares
// app.use(express.json());

// Routes

app.get("/pancakeswap/pools", async (_, res) => {
  const pools = await fetchPools(getMasterChefAddress());
  return res.json({
    pools,
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
