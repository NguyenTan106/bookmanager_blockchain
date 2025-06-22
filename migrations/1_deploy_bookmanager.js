const BookManager = artifacts.require("BookManager");

module.exports = function (deployer) {
  deployer.deploy(BookManager);
};
