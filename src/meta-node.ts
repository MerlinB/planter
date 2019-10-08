import * as bsv from "bsv";
import * as THNode from "meta-tree-hugger/lib/meta-node";
import { IOptions, Planter } from "./planter";

export default class MetaNode extends THNode {
  constructor(tx) {
    super(tx);
  }

  get keyPath(): string {
    const pathString = this.opReturn.s4;
    if (bsv.HDPrivateKey.isValidPath(pathString)) {
      return pathString;
    }
  }

  public async createChild(wallet: Planter, { parentTxID, ...opts }: IOptions = {}) {
    if (parentTxID) {
      throw new Error("parentTxID cannot be overriden when creating a child node");
    }

    return await wallet.createNode({
      ...opts,
      parentTxID: this.txid
    });
  }

  public async createUpdate(wallet: Planter, { keyPath, parentTxID, ...opts }: IOptions = {}) {
    if (this.keyPath && keyPath) {
      throw new Error("keyPath already set in OP_RETURN");
    } else if (!this.keyPath && !keyPath) {
      throw new Error("No keyPath provided for existing node");
    }

    if (!parentTxID) {
      parentTxID = this.isRoot ? null : this.tx.parent.tx;
    }

    return await wallet.createNode({
      ...opts,
      keyPath,
      parentTxID
    });
  }
}
