import { instance } from "bitindex-sdk";
import bsv from "bsv";
import { TreeHugger } from "./index";
import MetaNode from "./meta-node";
import { getRandomKeyPath } from "./utils";

const bitindex = instance();
const { Buffer } = bsv.deps;

const defaults = {
  feeb: 1.4,
  minimumOutputValue: 546
};

export interface IOptions {
  data?: string[];
  parentTxID?: string;
  parentKeyPath?: string;
  keyPath?: string;
  safe?: boolean;
  includeKeyPath?: boolean;
}

interface IScriptOptions {
  data?: string[];
  keyPath?: string;
  address: string;
  parentTxID?: string;
  safe?: boolean;
}

export class Planter {
  public xprivKey: bsv.HDPrivateKey;
  private spendInputs: bsv.Transaction.Output[];
  private query: object;

  constructor(xprivKey?: string) {
    this.xprivKey = xprivKey ? bsv.HDPrivateKey.fromString(xprivKey) : bsv.HDPrivateKey.fromRandom();
    this.query = {
      "in.h1": this.publicKey
    };
    this.spendInputs = [];
  }

  get fundingAddress() {
    return this.xprivKey.publicKey.toAddress().toString();
  }

  get publicKey() {
    return this.xprivKey.publicKey.toString();
  }

  public async findSingleNode(find = {}, opts?): Promise<MetaNode> {
    find = {
      ...find,
      ...this.query
    };
    return await TreeHugger.findSingleNode({ find }, opts);
  }

  public async findAllNodes(find = {}, opts?): Promise<MetaNode[]> {
    find = {
      ...find,
      ...this.query
    };
    return await TreeHugger.findAllNodes({ find }, opts);
  }

  public async findNodeById(id, opts?): Promise<MetaNode> {
    const find = { "node.id": id, ...this.query };
    return await TreeHugger.findSingleNode({ find }, opts);
  }

  public async findNodeByTxid(txid, opts?): Promise<MetaNode> {
    const find = { "node.tx": txid, ...this.query };
    return await TreeHugger.findSingleNode({ find }, opts);
  }

  public async findNodesByAddress(addr, opts?): Promise<MetaNode[]> {
    const find = { "node.a": addr, ...this.query };
    return await TreeHugger.findAllNodes({ find }, opts);
  }

  public async findNodesByParentId(id, opts?): Promise<MetaNode[]> {
    const find = {
      head: true,
      "parent.id": id,
      ...this.query
    };
    return await TreeHugger.findAllNodes({ find }, opts);
  }

  public async findNodeAndDescendants(id, opts?): Promise<MetaNode[]> {
    const find = {
      $or: [{ "node.id": id }, { "ancestor.id": id }],
      head: true,
      ...this.query
    };
    return await TreeHugger.findAllNodes({ find }, opts);
  }

  public async createNode({ data, parentTxID, parentKeyPath, keyPath, safe, includeKeyPath = true }: IOptions = {}) {
    keyPath = keyPath || getRandomKeyPath();

    const nodeAddress = this.xprivKey.deriveChild(keyPath).publicKey.toAddress();

    const utxos = await bitindex.address.getUtxos(this.fundingAddress);

    if (utxos.some(output => this.isSpend(output))) {
      return this.createNode({ data, parentTxID, parentKeyPath, keyPath, safe, includeKeyPath });
    }

    const balance = utxos.reduce((a, c) => a + c.satoshis, 0);

    const scriptOptions: IScriptOptions = {
      address: nodeAddress.toString(),
      data,
      parentTxID,
      safe
    };
    if (includeKeyPath) {
      scriptOptions.keyPath = keyPath;
    }
    const script = buildScript(scriptOptions);

    const tx = new bsv.Transaction()
      .from(utxos)
      .addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }))
      .to(nodeAddress, defaults.minimumOutputValue) // Dust output for future nodes
      .change(this.fundingAddress);

    const privateKeys = [this.xprivKey.privateKey.toString()];

    if (parentTxID) {
      if (!parentKeyPath) {
        const parent = await this.findNodeByTxid(parentTxID);

        if (!parent) {
          throw new Error("Unable to find parent node");
        }

        parentKeyPath = parent.keyPath;
        if (!parentKeyPath) {
          // TODO: Add option to pass parent node keyPath
          throw new Error("No keyPath found for parent node");
        }
      }

      const parentXPrivKey = this.xprivKey.deriveChild(parentKeyPath);
      const parentAddress = parentXPrivKey.publicKey.toAddress().toString();
      const parentUtxos = await bitindex.address.getUtxos(parentAddress);
      const parentPrivKey = parentXPrivKey.privateKey.toString();

      if (parentUtxos.length === 0) {
        // TODO: Optionally create funding tx
        throw new Error("Missing dust outputs for parent node. Create transction to parent node first.");
      }

      tx.from(parentUtxos);
      tx.to(parentAddress, defaults.minimumOutputValue); // Dust output for future nodes
      privateKeys.push(parentPrivKey);
    }

    const fee = Math.ceil(tx._estimateSize() * defaults.feeb);

    if (balance < fee) {
      throw new Error(`Not enough money (${balance} sat < ${fee} sat)`);
    }

    tx.fee(fee);
    tx.sign(privateKeys);

    const response = await bitindex.tx.send(tx.toString());

    if (!response.txid) {
      return response;
    }

    const nodeIDBuffer = Buffer.from(nodeAddress.toString() + response.txid);
    const nodeID = bsv.crypto.Hash.sha256(nodeIDBuffer).toString("hex");

    this.spendInputs = [...this.spendInputs, ...tx.inputs];

    return {
      ...response,
      address: nodeAddress.toString(),
      id: nodeID,
      keyPath
    };
  }

  private isSpend(utxo): boolean {
    for (const spend of this.spendInputs) {
      if (utxo.txid === spend.prevTxId.toString("hex") && utxo.outputIndex === spend.outputIndex) {
        return true;
      }
    }
    return false;
  }
}

function buildScript({ data = [], address, keyPath, parentTxID, safe }: IScriptOptions): bsv.Script {
  const script = new bsv.Script();

  if (safe) {
    script.add(bsv.Opcode.OP_FALSE);
  }
  script.add(bsv.Opcode.OP_RETURN);
  script.add(Buffer.from("meta"));
  script.add(Buffer.from(address));
  const parentRef = parentTxID || "NULL";
  script.add(Buffer.from(parentRef));
  if (keyPath) {
    script.add(Buffer.from(keyPath));
  }
  if (data) {
    script.add(Buffer.from("|"));
  }
  data.forEach(item => script.add(Buffer.from(item)));

  return script;
}
