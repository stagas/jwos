var CONST = require('const')
  , func = require('functions')

var Socket = function() {
  this.name = 'Socket'

  this.connected = false
  this.conn = {}
  this.buffer = []
  this.url = ''
}

Socket.prototype = {
  connect: function(url, reload) {
    var self = this
    this.url = url
    if (window['WebSocket']) {
      this.conn = new WebSocket(url)
      this.conn.onopen = function(e) {
        if (reload) window.location.reload(false)
        self.onopen.call(self, e)
      }
      this.conn.onclose = function(e) {
        self.onclose.call(self, e)
      }
      this.conn.onmessage = function(e) {
        self.onmessage.call(self, e)
      }
      this.conn.onerror = function(e) {
        self.onerror.call(self, e)
      }
      setInterval(function() {
        self.flush()
      }, CONST.FLUSH_INTERVAL)
    } else {
      alert('No sockets, man. Get Google Chrome or Firefox 4!')
    }
  }

, send: function(msg) {
    this.buffer.push(msg)
  }

, flush: function() {
    if (this.buffer.length) {
      this._send(this.buffer.join('|'))
      this.buffer = []
    }
  }

, _send: function(msg) {
    if (this.connected) this.conn.send(msg)
  }
  
, onmessage: function(e) {
    var spaceIndex = e.data.indexOf(' ')
      , id = e.data.substr(0, spaceIndex)
      , msg = e.data.substr(spaceIndex + 1)

    //console.log(e.data)

    if (e.data == '.') {
      // noop
    } else if (id == '*') {
      spaceIndex = msg.indexOf(' ')
      id = msg.substr(0, spaceIndex)
      msg = msg.substr(spaceIndex + 1)

      this.game.addPlayer.call(this.game, id, true)
      this.game.receive.call(this.game, id, msg)

    } else if (id == '^') {
      id = msg
      this.game.removePlayer.call(this.game, id)

    } else {
      this.game.addPlayer.call(this.game, id, false)
      this.game.receive.call(this.game, id, msg)
    }
  }

, onopen: function(e) {
    //log('connected')
    this.connected = true    
  }

, onclose: function(e) {
    //log('disconnected')
    this.connected = false
    /* setTimeout(function() {
      window.location.reload(false)
    }, 1000) */
    this.connect(this.url, true)
  }

, onerror: function(e) {
    //log(e)
  }

}

module.exports = Socket
