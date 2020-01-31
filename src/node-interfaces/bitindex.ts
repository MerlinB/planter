import { instance } from "bitindex-sdk";
import NodeInterface from "../node-interface";

interface IApiOptions {
  apiKey?: string;
}

/**
 * Implements decrecated BitIndex API Interface.
 */
export class BitIndex extends NodeInterface {
  get instance(this) {
    return instance();
  }

  public async getUTXOs(address: string) {
    return await this.instance.address.getUtxos(address);
  }

  public async sendRawTX(tx: string) {
    return await this.instance.tx.send(tx);
  }
}
