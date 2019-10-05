import * as THNode from "meta-tree-hugger/lib/meta-node";
import { IOptions, Planter } from "./push";

export default class MetaNode extends THNode {
  constructor(tx) {
    super(tx);
  }

  public async getDefaultKeyPath(): Promise<string> {
    if (this.isRoot) {
      return "m/0";
    }

    const parent = await this.parent({});
    const parentKeyPath = await parent.getDefaultKeyPath();
    const siblings = await this.selfAndSiblings({});
    return `${parentKeyPath}/${siblings.indexOf(this)}`;
  }

  public async getUnusedChildKeyPath(): Promise<string> {
    const children = await this.children({});
    const defaultKeyPath = await this.getDefaultKeyPath();
    return `${defaultKeyPath}/${children.length}`;
  }

  public async createChild(wallet: Planter, { keyPath, ...opts }: IOptions = {}) {
    if (!keyPath) {
      keyPath = await this.getUnusedChildKeyPath();
    }

    return await wallet.createNode({
      ...opts,
      keyPath,
      parentTxID: this.txid
    });
  }

  public async createUpdate(wallet: Planter, { keyPath, ...opts }: IOptions = {}) {
    const parentTxID = this.isRoot ? null : this.tx.parent.tx;

    if (!keyPath) {
      keyPath = await this.getDefaultKeyPath();
    }

    return await wallet.createNode({
      ...opts,
      keyPath,
      parentTxID
    });
  }
}
