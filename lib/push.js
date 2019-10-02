const bsv = require('bsv')
const bitindex = require('bitindex-sdk').instance();

const minimumOutputValue = 546;
const defaults = {
  fee: 400,
  feeb: 1.4
}

function estimateFee(script) {
    if (script.toBuffer().length > 100000) {
      throw `Maximum OP_RETURN size is 100000 bytes. Script is ${script.toBuffer().length} bytes.`;
    }

    const tempTX = new bsv.Transaction().from([getDummyUTXO()]);
    tempTX.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));

    return Math.max(tempTX._estimateFee(), minimumOutputValue);
  }

function getDummyUTXO() {
    return bsv.Transaction.UnspentOutput({
        address: '19dCWu1pvak7cgw5b1nFQn9LapFSQLqahC',
        txId: 'e29bc8d6c7298e524756ac116bd3fb5355eec1da94666253c3f40810a4000804',
        outputIndex: 0,
        satoshis: 5000000000,
        scriptPubKey: '21034b2edef6108e596efb2955f796aa807451546025025833e555b6f9b433a4a146ac'
    });
}

function buildScript(address, data, parentTxID, safe) {
  const script = new bsv.Script();

  if (safe) script.add(bsv.Opcode.OP_FALSE)

  script.add(bsv.Opcode.OP_RETURN);
  script.add(Buffer.from('meta'));
  script.add(Buffer.from(address));

  parentTxID = parentTxID || 'NULL'
  script.add(Buffer.from(parentTxID));

  if (Array.isArray(data)) {
    data.forEach(function(item) {
      // add push data
      if (item.constructor.name === 'ArrayBuffer') {
        let buffer = _Buffer.Buffer.from(item)
        script.add(buffer)
      } else if (item.constructor.name === 'Buffer') {
        script.add(item)
      } else if (typeof item === 'string') {
        if (/^0x/i.test(item)) {
          // ex: 0x6d02
          script.add(Buffer.from(item.slice(2), "hex"))
        } else {
          // ex: "hello"
          script.add(Buffer.from(item))
        }
      } else if (typeof item === 'object' && item.hasOwnProperty('op')) {
        script.add({ opcodenum: item.op })
      }
    })
  } else if (typeof data === 'string') {
    // Exported transaction 
    script = bitcoin.Script.fromHex(options.data);
  }
  return script
}

async function getBalance(address) {
  const utxos = await bitindex.address.getUtxos(address)
  return utxos.reduce((a, c) => a + c['satoshis'], 0)
}

async function payToAddress(fundingKey, amount, address) {
  fundingKey = bsv.PrivateKey.fromString(fundingKey)
  const fundingAddress = bsv.PublicKey.fromPrivateKey(fundingKey).toAddress()
  const utxos = await bitindex.address.getUtxos(fundingAddress)
  const balance = utxos.reduce((a, c) => a + c['satoshis'], 0)
  if (balance < amount) { throw `Not enough money (${balance} < ${amount})` }

  const tx = new bsv.Transaction()
    .from(utxos)
    .to(address, amount)
    .change(fundingAddress);
    
  tx.fee(Math.ceil(tx._estimateSize() * defaults['feeb']))
  tx.sign(fundingKey.toString());
  return await bitindex.tx.send(tx.toString());
}

function getParentPath(keyPath) {
  const pathArray = keyPath.split('/')
  if (pathArray.length > 2) {pathArray.pop()}
  return pathArray.join('/')
}

async function pushNode(privKey, script) {
  const address = bsv.PublicKey.fromPrivateKey(bsv.PrivateKey.fromString(privKey)).toAddress()
  const utxos = await bitindex.address.getUtxos(address)

  const tx = new bsv.Transaction()
    .from(utxos)
    .addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }))
    .change(address)

  tx.fee(Math.ceil(tx._estimateSize() * defaults['feeb']));
  tx.sign(privKey)
  
  return await bitindex.tx.send(tx.toString());
}

async function sleep(ms) {
  return new Promise(resolve => {
      setTimeout(resolve, ms)
  })
}

async function waitForUTXOs(address, amount) {
  while (true) {
    const parentBalance = await getBalance(address)
    if (parentBalance >= amount) return true
    await sleep(1000)
  }
}


async function createNode({xPrivKey, data=[], parentTxID, keyPath='m/0', fundingAddress, safe = true}) {

  if (!xPrivKey) throw 'No extended private key provided'
  const hdPrivateKey = bsv.HDPrivateKey.fromString(xPrivKey)
  const address = hdPrivateKey.deriveChild(keyPath).publicKey.toAddress()
  const script = buildScript(address, data, parentTxID, safe)
  const fee = estimateFee(script)
  const fundingKey = hdPrivateKey.privateKey

  const utxos = await bitindex.address.getUtxos(address.toString())
  const balance = utxos.reduce((a, c) => a + c['satoshis'], 0)

  if (parentTxID) {
    const parentPrivKey = hdPrivateKey.deriveChild(getParentPath(keyPath)) 
    const parentAddress = parentPrivKey.publicKey.toAddress().toString()
    const parentBalance = await getBalance(parentAddress)

    // if (parentBalance < fee) {
    //   console.log(`Creating funding transaction of ${fee - parentBalance} sat`)
    //   const fundingResponse = await payToAddress(fundingKey, fee - parentBalance, parentAddress)
    //   if (!fundingResponse.txid) {
    //     console.log(fundingResponse)
    //     throw 'Error sending funding transaction'
    //   }
    //   console.log('Waiting for unconfirmed parents')
    //   await waitForUTXOs(parentAddress, fee)
    // }

    // privKey = parentPrivKey.privateKey.toString()
  } else {
    const fundingBalance = await getBalance(hdPrivateKey.publicKey.toAddress().toString())
  
    if (fundingBalance < fee) { throw `Not enough money (${fundingBalance} < ${fee})` }
  }

  const tx = new bsv.Transaction()
    .from(utxos)
    .addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }))
    .change(address)

  tx.fee(Math.ceil(tx._estimateSize() * defaults['feeb']));
  tx.sign(privKey)
  
  const response = await bitindex.tx.send(tx.toString());

  if (!response.txid) {
    console.log(response);
    throw 'Error sending transaction'
  }
  return response
}


module.exports = { createNode }