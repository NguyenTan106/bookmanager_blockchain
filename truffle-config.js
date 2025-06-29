const path = require("path");
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      allowUnlimitedContractSize: true,
    },
    dashboard: {},
  },
  compilers: {
    solc: {
      version: "0.8.0",
      optimizer: {
        enabled: true,
        runs: 50, // ✅ đặt nhỏ để giảm kích thước mã
      },
    },
  },
  db: {
    enabled: false,
    host: "127.0.0.1",
  },
  contracts_build_directory: path.join(__dirname, "client/src/build/contracts"),
};
