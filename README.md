# Planter

Planter is a simple library for fetching and creating Metanet nodes on the **Bitcoin SV blockchain**.

# Install

```bash
npm i planter
```

Inlude *planter* in your project

```js
import { Planter } from "planter"
```

```html
<script src="https://unpkg.com/bsv@0.30.0/bsv.min.js"></script>
<script src="https://unpkg.com/planter/dist/planter.min.js"></script>
```
Be sure to include the [bsv library](https://docs.moneybutton.com/docs/bsv-overview.html) as well when using web version.

# Usage

```js
const planter = new Planter();

await planter.createNode({ data: ['Hello MetaNet'] })
```

This will generate a wallet for you and create a Metanet root node.

You can use an existing wallet by passing an [extended private Key](https://docs.moneybutton.com/docs/bsv-hd-private-key.html).

```js
const planter = new Planter("xprv9s21ZrQH143K3eQCpBqZiuLgNSFPAfkqimfqyDxJ6HAaVUqWWJ4vz7eZdhgkR66jD1a2BtQEXbYjjbfVXWhxz7g4sNujBt6cnAoJrdfLkHh");
```

Funding can be provided by depositing BSV to the associated address.

```js
planter.fundingAddress
```

## Creating root nodes

```js
await planter.createNode(options)
```

These additional options can be passed:

- `data: string[]` - Array of data to include in `OP_RETURN`
- `parentTxID: string` - For creating child nodes.
- `keyPath: string` - For setting the keyPath manually. Default is `m/0`.
- `safe: boolean` - Use OP_FALSE for scripts. False by default.


## Traversing the Metanet

Planter is built on top of [TreeHugger](https://treehugger.bitpaste.app/) and exposes its API for querying and traversing metanet nodes. See TreeHuggers [Github page](https://github.com/libitx/tree-hugger) for details.

```js
import { TreeHugger, Planter } from "planter"

const node = await TreeHugger.findNodeByTxid(txid)
```

Planter extends TreeHugger by adding two additional methods:

## Creating child nodes

```js
node.createChild()
```

## Creating updates

```js
node.createUpdate()
```