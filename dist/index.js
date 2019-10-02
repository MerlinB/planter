"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bsv = require("bsv");
class Wallet {
    constructor(xprivKey) {
        this.xprivKey = xprivKey
            ? bsv.HDPrivateKey.fromString(xprivKey)
            : bsv.HDPrivateKey.fromRandom();
    }
    get fundingAddress() {
        return this.xprivKey.publicKey.toAddress().toString();
    }
    createNode({ data = [], parentTxID, keyPath = "m/0", safe = true }) {
        const address = this.xprivKey.deriveChild(keyPath).publicKey.toAddress();
        const script = buildScript(address, data, parentTxID, safe);
        console.log(script);
        // if only keyPath, calc parentTxID
        // if only parentTxID, calc keyPath
    }
}
exports.Wallet = Wallet;
function buildScript(address, data, parentTxID, safe = true) {
    const { Buffer } = bsv.deps;
    const script = new bsv.Script();
    if (safe)
        script.add(bsv.Opcode.OP_FALSE);
    script.add(bsv.Opcode.OP_RETURN);
    script.add(Buffer.from("meta"));
    script.add(Buffer.from(address));
    const parentRef = parentTxID || "NULL";
    script.add(Buffer.from(parentRef));
    data.forEach(item => script.add(Buffer.from(item)));
    return script;
}
