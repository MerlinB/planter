import bsv from "bsv";
import THNode from "meta-tree-hugger/lib/meta-node";
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

  public async createChild(wallet: Planter, { parentTxID, parentKeyPath, ...opts }: IOptions = {}) {
    if (parentTxID) {
      throw new Error("parentTxID cannot be overriden when creating a child node");
    }

    if (this.keyPath && parentKeyPath) {
      throw new Error("parent node keyPath already set in OP_RETURN");
    } else if (!this.keyPath && !parentKeyPath) {
      throw new Error("No keyPath provided for parent node");
    }

    parentKeyPath = parentKeyPath || this.keyPath;

    return await wallet.createNode({
      ...opts,
      parentKeyPath,
      parentTxID: this.txid
    });
  }

  public async createUpdate(wallet: Planter, { keyPath, parentTxID, ...opts }: IOptions = {}) {
    if (this.keyPath && keyPath) {
      throw new Error("keyPath already set in OP_RETURN");
    } else if (!this.keyPath && !keyPath) {
      throw new Error("No keyPath provided for existing node");
    }

    keyPath = keyPath || this.keyPath;

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
