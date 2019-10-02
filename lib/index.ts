import * as bsv from "bsv";
import MetaNode from "./meta-node";
import TreeHugger from "meta-tree-hugger";

export class Wallet {
  xprivKey: bsv.HDPrivateKey;

  constructor(xprivKey?: string) {
    this.xprivKey = xprivKey
      ? bsv.HDPrivateKey.fromString(xprivKey)
      : bsv.HDPrivateKey.fromRandom();
  }

  get fundingAddress() {
    return this.xprivKey.publicKey.toAddress().toString();
  }

  createNode(options?: {
    data?: string[];
    parentTxID?: string;
    keyPath?: string;
    safe: boolean;
  }) {
    const address = this.xprivKey.deriveChild(keyPath).publicKey.toAddress();
    const script = buildScript(address, data, parentTxID, safe);

    console.log(script);

    // if only keyPath, calc parentTxID
    // if only parentTxID, calc keyPath
  }
}

function buildScript(
  address: string,
  data: string[],
  parentTxID?: string,
  safe: boolean = true
): bsv.Script {
  const { Buffer } = bsv.deps;
  const script = new bsv.Script();

  if (safe) script.add(bsv.Opcode.OP_FALSE);
  script.add(bsv.Opcode.OP_RETURN);
  script.add(Buffer.from("meta"));
  script.add(Buffer.from(address));
  const parentRef = parentTxID || "NULL";
  script.add(Buffer.from(parentRef));
  data.forEach(item => script.add(Buffer.from(item)));

  return script;
}
