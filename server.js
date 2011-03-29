/*
 *
 *  javascript world of soccer
 *  
 *  multiplayer soccer game made in javascript
 *
 *  (c) 2010 - 2011 stagas
 *  MIT Licenced
 *
 */

process.title = 'jwos'

if (typeof require.paths !== 'undefined')
  require.paths.unshift(__dirname + '/public/lib')

var util = require('util')
  , fs = require('fs')
  , http = require('http')
  , path = require('path')

  , crypto = require('crypto')
  
  , colors = require('colors')
  
  , connect = require('connect')
  , meryl = require('meryl')
  
  , ws = require('websocket-server')
  
  , func = require('functions')
  , CONST = require('const')  
  , Comm = require('comm')
  
// Config

var HOST = process.env.HOST || process.env.POLLA_HOST || CONST.HOST || 'localhost'
  , PORT = process.env.PORT || process.env.POLLA_PORT || CONST.PORT || 8755
  , WSPORT = +PORT + 2000
  , DEBUG = 1

var log = function() {
  if (DEBUG) {
    var msgarr = Array.prototype.slice.call(arguments).join(' ')
    if (DEBUG>1) {
      try {
        throw new Error()
      } catch(e) {
        var line = e.stack.split('\n')[3].split(':')[1]
        util.print('    '.slice(line.length) + line.cyan + ' ')
      }
    }
    util.print(
      ('[' + (new Date).toUTCString() + '] ')
    )
    console.log(msgarr)
  }
}

var logg = function() {
  var msgarr = Array.prototype.slice.call(arguments)
    , url = msgarr.shift().url
    
  msgarr = msgarr.join(' ')
  log(url.magenta + ':'.magenta, msgarr)
}

var logs = function() {
  var msgarr = Array.prototype.slice.call(arguments).join(' ')  
  log('S:'.green, msgarr)
}

var logws = function() {
  var msgarr = Array.prototype.slice.call(arguments).join(' ')  
  log('WS:'.red, msgarr)
}
  
var publicDir = path.join(__dirname, '/public')

meryl.p('GET /js/dynamic.js', function(req, res) {
  res.end('var WSPORT = ' + WSPORT + ';')
})

meryl.p('GET /lib/*', function(req, res, next) {
  var pathname = req.params.pathname
    , filename = path.join(publicDir, pathname)

  fs.readFile(filename, 'utf8', function(err, data) {
    pathname = pathname.replace(/^\/lib\//, '').replace(/.js$/, '')
    res.end("require.module('" + pathname + "', function(module, exports, require) { " + data + "});")
  })
})
meryl.p('GET *', connect.static(publicDir))
meryl.p('GET *', function(req, res, next) {
  req.url = '/'
  next()
})
meryl.p('GET *', connect.static(publicDir))

var server = connect.createServer(
  function(req, res, next) {
    if (typeof req.headers.ip !== 'undefined')
      req.headers.remoteAddress = req.headers.ip

    if (typeof req.headers.remoteAddress === 'undefined')
      req.headers.remoteAddress = req.connection.remoteAddress

    req.headers.ip = req.headers.remoteAddress
    next()
  }
, connect.logger({ format: 
      '[:date] '
    + ':req[ip] '.magenta
    + ':method '.yellow
    + ':status '.white
    + ':url '.green
    + ':user-agent :referrer :http-version'.grey 
    })
, connect.bodyParser()
, connect.cookieParser()
, connect.session({ secret: 'amigara' })
, meryl.cgi()
)

var websocket = ws.createServer({ debug: true })

/* process.on('uncaughtException', function (err) {
  log('Caught exception: '.red, err.message)
  var s = err.stack.split('\n')
  s.shift()
  console.log(s)
}) */

////

var Client = function(conn, game, cid, uid) {
  this.conn = conn
  this.game = game
  this.cid = cid
  this.uid = uid
  this.name = ''
  
  this.x = 400 + (Math.random() * 600)
  this.y = 600 + (Math.random() * 800)
  this.keys = 0
  this.looks = 'white_black'
  this.team = 'home'
  
  this.state = ''
  
  this.comm = new Comm()
  this.comm.alias(
    { 'Player': 'u'
    , 'Ball': 'b'
    , 'Game': 'p'
    }
  , { 'x': 'x'
    , 'y': 'y'
    , 'v': 'v'
    , 'z': 'z'
    , 'name': 'N'
    , 'keys': 'K'
    , 'looks': 'L'
    , 'walks': 'W'
    , 'a': 'a'
    , 's': 's'
    , 'vz': 'c'
    , 'team': 'T'
    , 'passTo': 'P'
    , 'owner': 'O'
    , 'passer': 'F'
    , 'kicker': 'S'
    , 'frame': 'f'
    }
  )
}

var ownerEnable = true

Client.prototype = {
  update: function() {

    this.comm.watch([
      ['Player', this, ['x', 'y', 'a', 'name', 'walks', 'keys', 'looks', 'team']]
    , ['Ball', this.game.ball, ['x', 'y', 'z', 'a', 's', 'v', 'vz', 'owner']]
    ])
 
    this.comm.publish([ 
      ['Player', this, ['x', 'y', 'a', 'name', 'walks', 'keys', 'looks', 'team']]
    , ['Ball', this.game.ball, ['x', 'y', 'z', 'a', 's', 'v', 'vz', 'owner']]
    , ['Game', this.game, ['kicker', 'passer', 'passTo']]
    //, ['Game', this.game, ['passTo']]
    ])
    
    this.comm.store()
    this.comm.last = {}
    var delta = this.comm.delta(this.comm.now, this.comm.last)
    this.state = this.comm.serialize(delta)
  }

, receive: function(msg) {
    var self = this
      , obj = this.comm.deserialize(msg)
    for (var o in obj) {
      if (o == 'Player') {
        for (var p in obj[o]) {
          this[p] = obj[o][p]
        }
      } else if (o == 'Ball') {
        for (var p in obj[o]) {
          if (p == 'owner') {
            if (ownerEnable) this.game.ball[p] = obj[o][p]
            ownerEnable = false
            setTimeout(function() {
              ownerEnable = true
            }, 3000)
          } else {
            this.game.ball[p] = obj[o][p]
          }
        }
      }
    }
    this.update()
  }
  
, send: function(message) {
    this.game.broadcast(this.cid, message)
  }
}

websocket.on('listening', function() {
  log('Websocket started:'.red, 'Listening for connections: ws://' + HOST + ':' + WSPORT)
})

var combinations = [
  'white_black'
, 'white_brown'
, 'white_blonde'
, 'black_black'
, 'black_brown'
, 'black_blonde'
]

websocket.on('connection', function(conn) {
  var url = conn._req.url, cid = conn.id, g
  if (typeof games[url] == 'undefined') g = games[url] = new Game(url)
  else g = games[url]
  
  var uid = g.getuid(cid)
  g.players[uid] = true
  var client = g.clients[cid] = new Client(conn, g, cid, uid)

  if (g.teams.home == 0 && g.teams.away == 0) {
    g.frame = 0
    g.frameStartTime = Date.now()
  }
  
  if (g.teams.away < g.teams.home) {
    g.teams.away++
    client.team = 'away'
  } else {
    g.teams.home++
    client.team = 'home'
  }

  client.looks = CONST.LOOKS.random()
  
  logg(g, 'Player connected:'.yellow, g.clients[cid].conn._req.connection.remoteAddress.magenta, uid, cid)

  logg(g, '* ' + uid + ' :uT' + client.team + '|L' + client.looks)
  
  conn.send('* ' + uid + ' :uT' + client.team + '|L' + client.looks) //+ '|:pf' + Math.floor((Date.now() - g.frameStartTime) / (1000/60)).C )
  
  client.send(client.uid +' :uT' + client.team + '|L' + client.looks)
  
  for (var k in g.clients) {
    g.clients[k].update()
    console.log(g.clients[k].state)    
    conn.send(g.clients[k].uid + ' ' + g.clients[k].state)
  }
  
  conn.on('message', function(message) {
    client.receive(message)
    logg(g, client.uid.toString().yellow, client.name.toString().green, message)
    client.send(client.uid +' '+ message)
  })
  
  conn.on('error', function(err) {
    console.log('ERROR:', err)
  })

  var removeClient = function() {
    logg(g, 'Player disonnected:'.red, g.clients[cid].conn._req.connection.remoteAddress.magenta, uid, cid)
    g.teams[client.team]--
    client.send('^ ' + uid)
    delete g.clients[cid]
    delete g.players[uid]
  }
  
  ;['close', 'timeout', 'end'].forEach(function(e) {
    conn.on(e, removeClient)
  })
})

var Ball = function(x,y) {
  this.x = x || 672
  this.y = y || 865
}

var games = {}

var Game = function(url) {
  var self = this

  this.url = url
  this.uid = 0
  this.players = {}
  this.clients = {}

  this.state = {}
  
  this.ball = new Ball()
  
  this.teams = {
    home: 0
  , away: 0
  }
  
  logg(this, 'Created new game', url.yellow)
  
  setInterval(function() {
    self.broadcastAll('.')
  }, 30 * 1000)
}

Game.prototype = {
  stateUpdate: function() {
    this.state = {}
    this.state['*'] = this.ball.x.F + ';' + this.ball.y.F
    for (var i in this.clients) {
      this.state[this.clients[i].uid] = this.clients[i].state
    }
  }

, sendState: function(cid) {
    var stateBuffer = []
    
    for (var i in this.state) {
      stateBuffer.push(i +' '+ this.state[i])
    }

    if (cid) {
      websocket.send(cid, stateBuffer.join(','))
    } else {
      this.broadcastAll(stateBuffer.join(','))
    }
  }

, broadcast: function(current, message) {
    for (var p in this.clients) {
      if (p != current) websocket.send(p, message)
    }
  }

, broadcastAll: function(message) {
    for (var p in this.clients) {
      websocket.send(p, message)
    }
  }

, getuid: function(id) {
    if (!id) id = this.uid++
    
    var hash = crypto.createHash('md5').update(id).digest('hex')
      , pos = 0

    do {
      pos++
    } while (typeof this.players[hash.slice(0, pos)] != 'undefined' && pos < hash.length)
    
    return hash.slice(0, pos)
  }
}

///////////

var retries = 0
  , maxRetries = 10
  , startedTimeout = null
  , serverStarted = function() {
      log( 'Server started: '.green
         + ('http://' + HOST + ':' + PORT).white
         + '\n-----------------------------------------------------------------------------------------'.grey
         )
      websocket.listen(WSPORT, HOST)   
    }

server.on('error', function (e) {
  if (e.errno == require('constants').EADDRINUSE) {
    clearTimeout(startedTimeout)
    
    retries++
    if (retries >= maxRetries) {
      log('Giving up, exiting.')
      return process.exit()
    }

    log('Address in use, retrying...')
    
    setTimeout(function () {
      try {
        server.close()
      } catch(e) {}
      server.listen(PORT, HOST)

      clearTimeout(startedTimeout)
      startedTimeout = setTimeout(serverStarted, 3000)
    }, 1000)
    
  }
})

server.listen(PORT, HOST)

startedTimeout = setTimeout(serverStarted, 3000)

// soft kill

process.on('SIGINT', function() {
  console.log('Killing me softly')
  try {
    server.close()
    websocket.close()
  } catch(e) {}
  process.exit()
})
