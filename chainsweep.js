chainsweep = {
	network: "BTCTEST", // default network

	// The networks here are based off of the networks that SoChain supports
	set_network: function(new_network) {
		switch(new_network) {
			case "BTC":
				this.network = new_network;
				return 0;
				break;
			case "LTC":
				this.network = new_network;
				return 0;
				break;
			case "DOGE":
				this.network = new_network;
				return 0;
				break;
			case "BTCTEST":
				this.network = new_network;
				return 0;
				break;
			case "LTCTEST":
				console.error("Unsupported Network " + new_network);
				return 1;
				break;
			case "DOGETEST":
				console.error("Unsupported Network " + new_network);
				return 1;
				break;
			default:
				console.error("Unrecognized Network " + new_network);
				return 1;
				break;
		}
	},

	// https://chain.so/api#introduction
	// returns a JSON string containing various variables for the chosen network
	get_info: function(callback) {
		$.get("https://chain.so/api/v2/get_info/" + this.network, function(response) {
			callback(response);
		});
	},

	// https://chain.so/api#get-balance
	// returns a number that is the unspent balance of the chosen address
	get_balance: function(callback) {
		$.get("https://chain.so/api/v2/get_address_balance/" + this.network, function(response) {
			callback(info.data.confirmed_balance);
		});
	},

	// https://chain.so/api#get-unspent-tx
	// will return an array of unspent transactions
	// this will recursively query the API as many times as necessary in order to get all the unspent TXs
	get_tx_unspent: function(address, callback) {
		return this.get_tx_unspent_after(address, "", callback);
	},

	// queries the API for unspent transactions after a given TX ID (required since the API returns a maximum of 100 unspent TXs)
	get_tx_unspent_after: function(address, aftertx, callback) {
		$.get("https://chain.so/api/v2/get_tx_unspent/" + this.network + "/" + address + "/" + aftertx, function(response) {
			if(response.status != "success") {
				console.error("get_tx_unspent: API Returned Failure");
				return 1;
			} else {
				if(Object.keys(response.data.txs).length >= 100) {
					console.log(">= 100 TXs found for " + address + ", querying again (last: " + response.data.txs[Object.keys(response.data.txs).length-1].txid + ")");
					this.get_tx_unspent_after(address, response.data.txs[Object.keys(response.data.txs).length-1].txid, function(nextresponse) {
						callback(response.data.txs.concat(nextresponse));
					});
				} else {
					callback(response.data.txs);
				}
			}
		});
		return 0;
	},

	// creates a hex formatted raw transaction for the given inputs
	// inputs: unspent transactions, a array of JSON objects containing at least a txid and output_no
	// key: the private key used to sign unspent inputs
	// destination: base58 destination address
	create_tx_raw: function(inputs, key, destination, callback) {
		var tx = new Bitcoin.Transaction();
		var amount = 0;
		inputs.forEach(function(obj) {
			tx.addInput(obj.txid, obj.output_no);
			amount += Number(obj.value);
		});
		tx.addOutput(destination, Math.round(amount*100000000));
		for(var txn = 0; txn < inputs.length; txn++) {
			tx.sign(txn, key);
		}
		callback(tx.toHex());
	},

	// https://chain.so/api#send-transaction
	// broadcasts a hex transaction
	send_tx_raw: function(hex, callback) {
		var obj = {};
		obj['tx_hex'] = hex;
		var post_data = JSON.stringify(obj);

		$.post("https://chain.so/api/v2/send_tx/" + this.network, obj, function() {

		}).done(function(response) {

		}).fail(function(response) {

		}).always(function(response) {
			callback(JSON.stringify(response.responseText));
			return 0;
		});
	},

	// sweep function
	// new_newtwork: acronym for the network: BTC, LTC, DOGE, or BTCTEST (networks supported by bitcoinjs-lib)
	// private_key: the private key (in WIF format) used to sign the unspent inputs, the public address to sweep will be derived from this private key
	// desitnation_address: the base58 address, the funds from private_key's public address will be swept here
	// callback will be passed the JSON response from SoChain
	sweep: function(new_network, private_key, destination_address, callback) {
		if(this.set_network(new_network) == 1) {
			return 1;
		} else {
			var key = "";
			try {
				var key = Bitcoin.ECKey.fromWIF(private_key);
			} catch(error) {
				console.error(error);
				return 1;
			}

			var source_address = "";
			switch(this.network) {
				case "BTC":
					source_address = key.pub.getAddress(Bitcoin.networks.bitcoin);
					break;
				case "LTC":
					source_address = key.pub.getAddress(Bitcoin.networks.litecoin);
					break;
				case "DOGE":
					source_address = key.pub.getAddress(Bitcoin.networks.dogecoin);
					break;
				case "BTCTEST":
					source_address = key.pub.getAddress(Bitcoin.networks.testnet);
					break;
				default:
					console.error("Unsupported Network " + network);
					return 1;
					break;
			}

			source_address = source_address.toString();
			
			this.get_tx_unspent(source_address, $.proxy(function(unspent_inputs) {
				if(unspent_inputs.length == 0) {
					console.error("Zero Unspent TXs for " + source_address);
					return 1;
				} else {
					this.create_tx_raw(unspent_inputs, key, destination_address, $.proxy(function(raw_tx) {
						this.send_tx_raw(raw_tx, function(result) {
							result = JSON.parse(result);
							//console.log(result.data.txid);
							callback(result);
						});
					}, this));
				}
			}, this));
			
		}
		return 0;
	}
}

