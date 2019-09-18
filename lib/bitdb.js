const fetch = require('node-fetch')

// import fetch from 'node-fetch'

const bitdb = {
  baseUrl: 'https://mom.planaria.network/q/',
  headers: {},

  // Create function to map obj
  // Can be ovewritten
  mapObject: obj => obj,

  find(qry, opts = {}) {
    const query = this._buildQuery(qry, opts),
          path  = this._encodeQuery(query),
          url   = this.baseUrl + path,
          head  = { ...this.headers, ...opts.headers };

    if (opts.debug) {
      console.log(JSON.stringify(query))
      console.log(url)
    }

    return fetch(url, { headers: head })
      .then(r => r.json())
      .then(data => {
        return data.metanet.map(this.mapObject)
      })
  },

  findSingle(q, opts) {
    const sort = { "blk.i": -1, i: -1 },
          limit = 1,
          query = { sort, limit, ...q };

    return this.find(query, opts)
      .then(data => data[0] || null)
  },

  findAll(q, opts) {
    const sort = { "blk.i": 1, i: 1 },
          query = { sort, ...q };

    return this.find(query, opts)
  },

  _buildQuery(q, opts = {}) {
    const query = { v: 3, q }
    const q2 = Object.keys(opts)
      .filter(k => ['aggregate', 'project', 'sort', 'limit', 'skip'].includes(k))
      .reduce((o, k) => { o[k] = opts[k]; return o; }, {})
    // Merge base query and optional overrides
    Object.assign(query.q, q2)
    // Merge find object seperated so to effectively deep-merge
    if (opts.find) {
      Object.assign(query.q.find, opts.find)
    }
    // If project opbject is set, mandatory options always present
    if (query.q.project) {
      Object.assign(query.q.project, { node: 1, parent: 1, ancestor: 1, child: 1 })
    }
    return query;
  },

  _encodeQuery(query) {
    const str = JSON.stringify(query);
    if (typeof btoa == 'function') {
      return btoa(str);
    } else {
      return Buffer.from(str).toString('base64');
    }
  }
}

module.exports = bitdb;