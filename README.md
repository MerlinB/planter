# Planter

Planter is a simple library for fetching and creating Metanet Nodes on the **Bitcoin SV blockchain**.

# Status

In active development. Expect things can break.

# Install

```bash
npm install https://github.com/MerlinB/planter.git
```

# Usage

```js
const planter = require('planter')
```

Creating a new node requires an [extended private Key](https://docs.moneybutton.com/docs/bsv-hd-private-key.html), as all public node addresses are derived from it. The [bsv library](https://docs.moneybutton.com/docs/bsv-overview.html) can be used to easily generate one.

```js
const bsv = require('bsv')

const hdPrivateKey = bsv.HDPrivateKey.fromRandom()
```

Funding can be provided by depositing BSV to the associated address.

```js
const address = hdPrivateKey.publicKey.toAddress().toString()
```
## Creating root nodes

```js
await planter.createNode({
  xPrivKey: hdPrivateKey.toString(),
  data: ['hello metanet']
})
``` 

These additional options can be passed:

- `parentTxID` - For creating child nodes. Alternatively, use `node.createUpdate`.
- `keyPath` - For setting the keyPath manually. Default is `m/0`.  
- `safe` - Use OP_FALSE for scripts. True by default.

```js
await planter.createNode({
  xPrivKey: hdPrivateKey.toString(),
  data: ['hello metanet'],
  parentTxID: parentTxID,
  keyPath: 'm/0',
  safe: true
})
``` 

## Traversing the Metanet

Planter offers the same API as [treehugger](https://treehugger.bitpaste.app/) for fetching and traversing Metanet Nodes.

```js
const node = await TreeHugger.findNodeByTxid(txid)
```

## Creating child nodes

```js
node.createChild({
  xPrivKey: hdPrivateKey,
  data: ['I am a child node']
})
```

## Creating updates

Note that an update is simply a new node with the same `keyPath` and can also be created using `createNode` to avaid an additional query.

```js
node.createUpdate({
  xPrivKey: hdPrivateKey,
  data: ['I am a update']
})
```