const bitdb = require('./bitdb')
const MetaNode = require('./meta-node')
const push = require('./push')

bitdb.mapObject = obj => new MetaNode(obj)

const planter = {

  async findSingleNode(query, opts) {
    return await bitdb.findSingle(query, opts)
  },

  async findAllNodes(query, opts) {
    return await bitdb.findAll(query, opts)
  },

  async findNodeById(id, opts) {
    const find = { "node.id": id }
    return await bitdb.findSingle({ find }, opts)
  },

  async findNodeByTxid(txid, opts) {
    const find = { "node.tx": txid }
    return await bitdb.findSingle({ find }, opts)
  },

  async findNodesByAddress(addr, opts) {
    const find = { "node.a": addr }
    return await bitdb.findAll({ find }, opts)
  },

  async findNodesByParentId(id, opts) {
    const find = {
      "parent.id": id,
      "head": true
    }
    return await bitdb.findAll({ find }, opts)
  },

  async findNodeAndDescendants(id, opts) {
    const find = {
      "$or": [
        { "node.id": id },
        { "ancestor.id": id }
      ],
      "head": true
    }
    return await bitdb.findAll({ find }, opts)
  },

  async createNode(opts) {
    return await push.createNode(opts)
  },
}

module.exports = planter