/**
 * Node Interface to be implemented. Any implemetation needs to implement both getUTXOs and sendRawTX.
 */
export default abstract class NodeInterface {
  /**
   * @param opts - Interface Options
   */
  constructor(public opts = {}) {}

  /**
   * Should return an Array of UTXOs.
   *
   * @param address - Address
   */
  public abstract async getUTXOs(address: string): Promise<any[]>;

  /**
   * Should return a response containing the txid if successful.
   *
   * @param tx - Raw transaction string
   */
  public abstract async sendRawTX(tx: string): Promise<any>;
}
