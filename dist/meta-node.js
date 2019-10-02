"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THNode = require("meta-tree-hugger/lib/meta-node.js");
class MetaNode extends THNode {
    constructor(tx) {
        super(tx);
    }
    async getDefaultKeyPath() {
        if (this.isRoot)
            return "m/0";
        const parent = await this.parent({});
        const parentKeyPath = await parent.getDefaultKeyPath();
        const siblings = await this.selfAndSiblings({});
        return `${parentKeyPath}/${siblings.indexOf(this)}`;
    }
    async getUnusedChildKeyPath() {
        const children = await this.children({});
        const defaultKeyPath = await this.getDefaultKeyPath();
        return `${defaultKeyPath}/${children.length}`;
    }
    async createChild({ wallet, data, keyPath, safe }) {
        if (!keyPath)
            keyPath = await this.getUnusedChildKeyPath();
        return await wallet.createNode({
            data,
            keyPath,
            parentTxID: this.txid,
            safe
        });
    }
    async createUpdate({ wallet, data = [], keyPath = "m/0", safe = true }) {
        const parentTxID = this.isRoot ? null : this.tx.parent.tx;
        if (!keyPath) {
            keyPath = await this.getDefaultKeyPath();
        }
        return await wallet.createNode({
            data,
            keyPath,
            parentTxID: this.txid,
            safe
        });
    }
}
exports.default = MetaNode;
