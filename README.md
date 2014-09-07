chainsweep
==========

Sweep coins from a private key to a new address using SoChain's API

This is a Javascript class that uses [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) and [jQuery](http://jquery.com/) to sweep Bitcoin, Litecoin, Dogecoin, and Bitcoin Testnet coins to a new address.

The [SoChain](https://chain.so) API is used to get unspent transactions and to broadcast transactions. All signing and transaction creation is done in the browser using bitcoinjs-lib.

An example is included (demo/example.html). Please make sure to run this on a web server, otherwise, if it is running from file://, the browser's default security policies will prevent requests to the API from happening.  

Example Usage (sweep a Dogecoin private key to the SoChain developer fund)
```javascript
chainsweep.sweep("DOGE", "QSbMjLHZ6cMtQ9kcyWytEtLw7wBHGriHE9kHnUKdKqGvPpKvArof", "DFundmtrigzA6E25Swr2pRe4Eb79bGP8G1", function(result) {
  console.log(result);
});
```
Valid networks are BTC, LTC, DOGE, and BTCTEST

You will need to create a standalone bitcoinjs-lib for running in a browser. Visit bitcoinjs-lib's GitHub page for instructions: https://github.com/bitcoinjs/bitcoinjs-lib
