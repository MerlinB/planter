const { Wallet } = require("./dist");

const wallet = new Wallet();

console.log(wallet.fundingAddress);
console.log(wallet.createNode());
