import axios from "axios";
import { instance } from "mattercloudjs";
import NodeInterface from "../node-interface";

interface IApiOptions {
  apiKey?: string;
}

/**
 * Implements MatterCloud API Interface.
 * The Mattercloud API requires an api key. By default the public key from the wallet is used.
 */
export class Mattercloud extends NodeInterface {
  public static async requestApiKey(): Promise<string> {
    const response = await axios.post("https://api.bitindex.network/api/v2/registration/account?secret=secretkey");
    const apiKey = response.data && response.data.apiKey;
    if (!apiKey) {
      throw new Error("Failed to request MatterCloud API key.");
    }
    return apiKey;
  }

  constructor(public opts: IApiOptions = {}) {
    super(opts);
  }

  get instance(this) {
    return instance({ api_key: this.opts.apiKey });
  }

  public async init() {
    if (!this.opts.apiKey) {
      this.opts.apiKey = await Mattercloud.requestApiKey();
    }
  }

  public async getUTXOs(address: string) {
    await this.init();
    return await this.instance.getUtxos(address, {});
  }

  public async sendRawTX(tx: string) {
    await this.init();
    return await this.instance.sendRawTx(tx);
  }
}
