import * as BitIndexSDK from "bitindex-sdk";
import * as bsv from "bsv";

const bitindex = BitIndexSDK.instance();
const { Buffer } = bsv.deps;

const defaults = {
  feeb: 1.4,
  minimumOutputValue: 546
};

export interface IOptions {
  data?: string[];
  parentTxID?: string;
  keyPath?: string;
  safe?: boolean;
}

export class Planter {
  private xprivKey: bsv.HDPrivateKey;

  constructor(xprivKey?: string) {
    this.xprivKey = xprivKey ? bsv.HDPrivateKey.fromString(xprivKey) : bsv.HDPrivateKey.fromRandom();
  }

  get fundingAddress() {
    return this.xprivKey.publicKey.toAddress().toString();
  }

  public async createNode({ data, parentTxID, keyPath = "m/0", safe }: IOptions = {}) {
    const nodeAddress = this.xprivKey.deriveChild(keyPath).publicKey.toAddress();
    const script = buildScript(nodeAddress.toString(), data, parentTxID, safe);
    const utxos = await bitindex.address.getUtxos(this.fundingAddress);

    const balance = utxos.reduce((a, c) => a + c.satoshis, 0);

    const tx = new bsv.Transaction()
      .from(utxos)
      .addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }))
      .to(nodeAddress, defaults.minimumOutputValue) // Dust output for future nodes
      .change(this.fundingAddress);

    const privateKeys = [this.xprivKey.privateKey.toString()];

    if (parentTxID) {
      const parentAddress = this.xprivKey.deriveChild(getParentPath(keyPath)).publicKey.toAddress();
      const parentUtxos = await bitindex.address.getUtxos(parentAddress.toString());
      const parentPrivKey = this.xprivKey.deriveChild(getParentPath(keyPath)).privateKey.toString();

      if (parentUtxos.length === 0) {
        throw new Error("@TODO: Missing dust outputs for parent node. Create additional funding TX.");
      }

      tx.from(parentUtxos);
      tx.to(parentAddress.toString(), defaults.minimumOutputValue); // Dust output for future nodes
      privateKeys.push(parentPrivKey);
    }

    const fee = Math.ceil(tx._estimateSize() * defaults.feeb);

    if (balance < fee) {
      throw new Error(`Not enough money (${balance} < ${fee})`);
    }

    tx.fee(fee);
    tx.sign(privateKeys);

    const response = await bitindex.tx.send(tx.toString());

    if (!response.txid) {
      throw new Error("Error sending transaction");
    }

    const nodeIDBuffer = Buffer.from(nodeAddress.toString() + response.txid);
    const nodeID = bsv.crypto.Hash.sha256(nodeIDBuffer).toString("hex");

    return {
      ...response,
      address: nodeAddress.toString(),
      id: nodeID
    };
  }
}

function buildScript(address?: string, data: string[] = [], parentTxID?: string, safe: boolean = false): bsv.Script {
  const script = new bsv.Script();

  if (safe) {
    script.add(bsv.Opcode.OP_FALSE);
  }
  script.add(bsv.Opcode.OP_RETURN);
  script.add(Buffer.from("meta"));
  script.add(Buffer.from(address));
  const parentRef = parentTxID || "NULL";
  script.add(Buffer.from(parentRef));
  data.forEach(item => script.add(Buffer.from(item)));

  return script;
}

function getParentPath(keyPath) {
  const pathArray = keyPath.split("/");
  if (pathArray.length > 2) {
    pathArray.pop();
  }
  return pathArray.join("/");
}
