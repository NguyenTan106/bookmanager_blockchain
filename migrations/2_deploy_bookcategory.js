const BookCategory = artifacts.require("BookCategory");

module.exports = function (deployer) {
  deployer.deploy(BookCategory);
};
