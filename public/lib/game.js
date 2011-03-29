/*
 *
 *  Game
 *
 */

var CONST = require('const')
  , LOOKS = CONST.LOOKS
  , DIRECTION = CONST.DIRECTION
  , KEYS = CONST.KEYS
  , STADIUM = CONST.STADIUM
  , HOST = CONST.HOST
  
  , func = require('functions')
  , Comm = require('comm')
  , Camera = require('camera')
  , State = require('state')
  , Timer = require('timer')
  , Player = require('player')
  , Team = require('team')
  , Socket = require('socket')
  , Keys = require('keys')
  , Ball = require('ball')
  
var Game = function() {
	this.objects = {}
  this.players = {}
  
  this.passTo = -1
  this.passer = -1
  this.kicker = -1
  this.lastKicker = -1
  this.passToTimeout = null
  this.kickTimeout = null
  
  this.team = {
    home: new Team()
  , away: new Team()
  }
  
  this.team['home'].players = this.players
  this.team['away'].players = this.players
  
  this.camera = new Camera()
  this.state = new State()
  this.timer = new Timer()
  this.keyHandler = new Keys(this)
  this.keys = 0
  this.frame = null
  this.ball = new Ball({x: 220, y: 200})
  this.ball.game = this
  this.ballInterval = true
  this.followBall = false
  
  this.comm = new Comm(this)
  this.socket = new Socket()
  
  this.master = -1
  this.player_uid = 0
  
  this.window = {
    width: document.body.clientWidth
  , height: document.body.clientHeight
  }
  
  var canvas = document.getElementById('c')

  this.draw = function(x1,y1, x2,y2) {
    var ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0,0,1000,1000)
    ctx.beginPath()
    ctx.moveTo(x1,y1)
    ctx.lineTo(x2,y2)
    ctx.stroke()
  }  

  this.drawB = function(ar) {
    var ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0,0,1000,1000)
    
    ctx.fillStyle = "rgba(255,0,0,0.4)"
    ctx.beginPath()
    ctx.moveTo(ar[0].x, ar[0].y)
    for (var i=0; i<ar.length; i++) {
      ctx.lineTo(ar[i].x,ar[i].y)
    }
    ctx.stroke()
    ctx.fill()
  }
  
}

Game.prototype = {
  init: function() {
    var self = this
  
    var seenHelp = func.get_cookie('help')
    if (!seenHelp) {
      alert(CONST.WELCOME)
      func.set_cookie('help', 'deletetoseeagain')      
    }
    
    window.onresize = function() {
    
      self.window = {
        width: document.body.clientWidth
      , height: document.body.clientHeight
      }
    }
  
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

    this.socket.game = this
    this.addObject('camera', this.camera)
    this.addObject('ball', this.ball)
    //this.addPlayer(-1, true)
    //this.addPlayer(null)
    //this.addPlayer(null)
    this.socket.connect('ws://' + HOST + ':' + WSPORT + window.location.pathname)
    window.onunload = window.onclose = function() {
      self.socket.close()
      alert('closing socket')
    }
  }
  
, addPlayer: function(id, isMaster, team) {
    if (id == -1) id = ++this.player_uid
    
    if (typeof this.players[id] === 'undefined') {
      this.players[id] = new Player(id, 200, 200)
//      this.setTeam(this.players[id], (team || ['home', 'away'].random()))
      this.addObject(id, this.players[id])

      if (isMaster) {
        this.master = id
        this.players[this.master].changeName()

        var classNameOld = this.players[this.master].sprite.object.className
          , classNameArray = classNameOld.split(' ')

        classNameArray.push('master')
        this.players[this.master].sprite.object.className = classNameArray.join(' ')
      }
    }
	}

, removePlayer: function(id) {
    if (typeof this.players[id] === 'undefined') return
    
    document.body.removeChild(this.players[id].sprite.object)
    delete this.team[this.players[id].team].lineup[this.players[id]]
    delete this.players[id]
  }
  
, setTeam: function(player, team) {
    var id = player.id
    if (team != this.players[id].team && this.players[id].team) {
      delete this.team[this.players[id].team].lineup[id]
    }
    if (!team) return
    
    this.players[id].team = team
    
    this.team[this.players[id].team].lineup[id] = this.players[id]
    this.players[id].sprite.object.className = 'player ' + this.players[id].team + ' ' + this.players[id].looks
  }
  
, addObject: function(id, obj) {
    this.objects[id] = obj
  }

, setPassTo: function(playerid) {
    //console.log('pass goes to', playerid)
    this.passTo = playerid
  }

, delPassTo: function() {
    if (this.players[this.passTo]) {
      this.players[this.passTo].walks = 0
      this.players[this.passTo].cpu = 0
      this.players[this.passTo].direction = ''
      this.passTo = -1
    }
  }
  
, moveCameraTo: function(coords) {
    // set delta to the center of our viewport
		this.camera.dx = coords.x - (this.window.width / 2)
		this.camera.dy = coords.y - (this.window.height / 2)
	}
  
, handleKeys: function() {
    var self = this
    
    if (this.master == -1) return setTimeout(function() { self.handleKeys() }, CONST.HANDLEKEYS_TIMEOUT)
    //if (typeof this.players[this.master] === 'undefined')
    //  this.addPlayer(-1, true)
      
    //console.log('we have master', this.master)
    if (this.players[this.master].monkey && this.passTo != this.master) {
      if (Math.random() * 4000 < Math.random() * 300) {
        this.keys = this.players[this.master].keys = func.randomProperty(KEYS)
        if (this.keys != 5 && this.keys != 7 && this.keys != 10) {
        this.players[this.master].direction = KEYS[this.keys]
        //console.log(this.keys, this.players[this.master].direction)
        } else {
          this.keys = 0
          this.players[this.master].direction = ''
        }
      }
    } else {
      this.keys = this.players[this.master].keys = this.keyHandler.pressed
      this.players[this.master].direction = KEYS[this.keys]
    }
    
    if (this.keyHandler.shoot && this.ball.owner == this.master && this.players[this.master].shoot >= 6 && this.kicker != this.master) {

      this.players[this.master].shoot = 0
      
      // reset swerve, set new angle and apply forces
      this.ball.s = 0
      this.ball.a = this.players[this.master].a
      this.ball.v = this.players[this.master].kickPower
      this.ball.vz = this.players[this.master].kickPower * 0.16

      // get closest player to where the kicker faces
      if (typeof this.team[this.players[this.master].team] !== 'undefined') {
        passTo = this.team[this.players[this.master].team].getClosest(
          this.players[this.master].x + (300 * Math.cosa(this.players[this.master].a))
        , this.players[this.master].y + (300 * Math.sina(this.players[this.master].a))
        , this.master
        )
      }
      
      if (passTo) {
        // tell the game where we're passing to
        this.setPassTo(passTo.id)
        this.setOwner(-1)
        this.passer = this.master       
        if (!this.passToTimeout) {
          this.passToTimeout = setTimeout(function() {
            self.passer = -1
            self.passToTimeout = null
          }, CONST.PASSTO_TIMEOUT)
        }
      }

      this.kicker = this.master 
      this.lastKicker = this.kicker
      
      if (!this.kickTimeout) {
        this.kickTimeout = setTimeout(function() {
          self.lastKicker = self.kicker
          self.kicker = -1
          self.kickTimeout = null
        }, CONST.KICK_TIMEOUT)
      }
      
    }
    
    if (this.keyHandler.shoot) this.players[this.master].shoot++
    else {
      if ( this.players[this.master].shoot
        && this.players[this.master].shoot < 6
        && this.ball.owner == this.master
        ) {

        //console.log('passing')
        
        var passTo
        
        if (typeof this.team[this.players[this.master].team] !== 'undefined') {
          passTo = this.team[this.players[this.master].team].getClosest(
            this.players[this.master].x
          , this.players[this.master].y
          , this.master
          )
        }
        
        if (passTo) {
          this.setPassTo(passTo.id)

          // calculate ball direction
          var dx = passTo.x - this.ball.x
            , dy = passTo.y - this.ball.y
            , dist = Math.sqrt(dx*dx + dy*dy)
            , angle = Math.atan2(dy, dx) * 180 / Math.PI

          this.ball.a = angle
      
          // apply forces
          this.ball.v = Math.max(dist * 0.0165, 11)
          this.ball.vz = dist * 0.0022

          this.setOwner(-1)
          
          this.passer = this.master
          if (!this.passToTimeout) {
            this.passToTimeout = setTimeout(function() {
              self.passer = -1
              self.passToTimeout = null
            }, CONST.PASSTO_TIMEOUT)
          }
          //console.log('PASSING BALL TO', dx, dy, this.ball.a, this.ball.v)          
        }
      }
      this.players[this.master].shoot = 0
    }


	}

, setOwner: function(id) {
    if (id != this.ball.owner) this.ball.previousOwner = this.ball.owner
      
    // set the new owner
    this.ball.owner = id.toString()
	}

, checkBallNear: function(id) {
    var dx, dy, dist

    if (typeof this.players[id] === 'undefined') return false
    
    dx = this.players[id].x - this.ball.x
    dy = this.players[id].y - this.ball.y
    dist = Math.sqrt(dx*dx + dy*dy)

    return (dist < 4 + 16 && this.ball.z < 10 && this.ball.vz < 8)
  }
  
, checkBallOwner: function() {
    var self = this
      , owner = -1

    // check who's owner
    for (var id in this.players) {
      this.players[id].dribbling = false
      if (id != this.ball.owner && this.checkBallNear(id)) {
        owner = id
        this.players[id].dribbling = true
      }
    }

    // we check the current ball owner last, so they don't conflict
    if (owner == -1 && this.ball.owner != -1) {
      if (this.checkBallNear(this.ball.owner)) owner = this.ball.owner
    }
    
    this.setOwner(owner)
	}
	
, checkBallCollision: function(player) {
    if (typeof player === 'undefined') return false
  
    return ( func.isPointInPoly(player.feet, {x: this.ball.x, y: this.ball.y}) )
	}

, dribble: function(player) {
    // Dribbling is 85% similar
    // needs work, it can get better
    
    if (!player.walks) return

    this.ball.a = player.a
    if (this.ball.v < player.dribbleSpeed)
      this.ball.v = player.dribbleSpeed * 1.06
    
    var mut = 0.0175

    var ax = (func.dotLineLength(this.ball.x, this.ball.y, player.feet[0].x, player.feet[0].y, player.feet[3].x, player.feet[3].y, false) * 1.30) * mut
    
    if (ax > 0) this.ball.v += ax
	}
  
, receive: function(id, msg) {
    var self = this
      , remoteFrame = this.frame

    var obj = this.comm.deserialize(msg)
    
    //console.log(id, obj)

    for (var o in obj) {
      if (o == 'Player') {
        for (var p in obj[o]) {
          //console.log(id, o, p, obj[o][p])
          if (p == 'looks') {
            //console.log(obj[o][p])
            this.players[id][p] = obj[o][p]
            this.players[id].sprite.object.className = 'player ' + this.players[id].team + ' ' + this.players[id][p] + (
              (id == this.master) ? ' master' : ''
            )
          } else if (p == 'team') {
            //console.log(obj[o][p])
            this.setTeam(this.players[id], obj[o][p])
            this.players[id].sprite.object.className = 'player ' + this.players[id].team + ' ' + this.players[id].looks + (
              (id == this.master) ? ' master' : ''
            )            
          } else if (p == 'keys') {
            this.players[id].keys = obj[o][p]
            //if (this.players[id].keys != 0) this.players[id].walks = 1
            this.players[id].direction = KEYS[obj[o][p]]
          } else if (p == 'name') {
            //this.players[id].name = obj[o][p]
            this.players[id].changeName(obj[o][p])
          } else {
            this.players[id][p] = obj[o][p]
          }
        }
      } else if (o == 'Ball' && this.ball.owner != this.master) {
        for (var p in obj[o]) {
          //console.log(o, p, obj[o][p])
          //console.log(p, ball[p], 'vers', obj[o][p])
          if (p == 'owner') {
            this.setOwner(obj[o][p])
          } else {
            this.ball[p] = obj[o][p]
          }
        }
      } else if (o == 'Game') {
        for (var p in obj[o]) {
          //console.log(o, p, obj[o][p])
          if (p == 'passTo') {          
            this.setPassTo(obj[o][p])
            this[p] = obj[o][p]
            this.setOwner(-1)
          } else if (p == 'frame') {
            remoteFrame = obj[o][p]         
            if (this.frame == null) {
              this.frame = this.state.frame = remoteFrame
            }
          }
          else this[p] = obj[o][p]
        }
      }
    }   
  }
  
, logic: function() {
    var self = this
    
    this.checkBallOwner()
    
    this.handleKeys()
    
    //if (this.players[this.master].feet.length) this.drawB(this.players[this.master].feet)
    
    if (this.ball.owner != -1 && this.passer != this.ball.owner) {
      if (this.checkBallCollision(this.players[this.ball.owner]) ) {
        this.players[this.ball.owner].dribbling = true
        this.dribble(this.players[this.ball.owner])
      } else {
        this.players[this.ball.owner].dribbling = false      
      }
    }
    
    if (this.passTo != -1 && this.ball.owner == this.passTo) {  //  && this.ball.owner == this.passTo
      this.delPassTo()
      //this.players[this.passTo].cpu = 0
      this.ball.v = 0
      this.ball.vz = 0
      this.ball.z = 0
      this.passer = -1
      //console.log('stopped passing')
    } else if (this.passTo != -1 && this.ball.owner != this.passTo && this.ball.owner != -1 && this.ball.owner != this.master) {
      this.delPassTo()
      this.passer = -1
    }
        
    if (this.passTo != -1) {
      this.players[this.passTo].cpuWalkTo(this.ball.x, this.ball.y)
    }
    
    var cameraX, cameraY

    if (typeof this.players[this.master] !== 'undefined' && typeof this.players[this.master].direction !== 'undefined') {
    
      cameraX = ((this.players[this.master].x + this.players[this.master].vx * 7) / 2) + (this.ball.x / 2)
      cameraY = ((this.players[this.master].y + (this.players[this.master].vy * 17)) / 2) + (this.ball.y / 2)
    
      var ww = this.window.width/2
        , hh = this.window.height/2
        
      var dist = 130
        , mul = 18
        , ahead = 20
      if (cameraX < this.ball.x - ww + (this.ball.vx * ahead)) cameraX = this.ball.x - ww + dist + (this.ball.vx * mul)
      if (cameraY < ((this.ball.y + (this.ball.vy * ahead)) - this.ball.z) - hh + dist) cameraY = ((this.ball.y + (this.ball.vy * mul)) - this.ball.z) - hh + dist + (this.ball.vy * mul)
      if (cameraX - ww > this.ball.x - dist + (this.ball.vx * ahead)) cameraX = this.ball.x + ww - dist + (this.ball.vx * mul)
      if (cameraY - hh > ((this.ball.y + (this.ball.vy * ahead)) - this.ball.z) - dist ) cameraY = ((this.ball.y + (this.ball.vy * mul)) - this.ball.z) + hh - dist + (this.ball.vy * mul)
    
      this.moveCameraTo({
        x: cameraX
      , y: cameraY
      })
    
    }
  }
  
, update: function() {
    for (var i in this.objects) {
      if (i != this.remote)
        this.state.add( this.objects[i], this.objects[i].update() )
    }
  }
	
, loop: function(ms) {  
    var self = this
    
    this.timer.tick()
    
    while (this.timer.overflow(ms)) {
      if (this.frame !== null) {
        //$('#console').text(this.frame)
        this.frame++
      }
      this.state.remember().clear()
      this.update()
    }

    this.state.render(this.state.alpha(this.timer.alpha(ms)))
    
    if (this.master != -1) {

      // watch
      var arr = []
        , yes = (Math.random() * 20 < 2)
      
      arr.push(['Player', this.players[this.master], ['walks', 'name', 'keys', 'looks']])
      if (this.passer == this.master) arr.push(['Game', this, ['passTo']])
      
      this.comm.watch(arr)
      
      // publish
      arr = []
      
      arr.push(['Player', this.players[this.master], ['x', 'y', 'a', 'walks', 'name', 'keys', 'looks']])
      if (this.passer == this.master) {
        arr.push(['Game', this, ['passTo']])
      }
      
      if ((this.ball.owner != -1 || this.kicker != -1 || this.passer != -1) && (this.ball.owner == this.master || this.ball.previousOwner == this.master)) arr.push(['Ball', this.ball, ['x', 'y', 'z', 'a', 's', 'v', 'vz', 'owner']])

      if (this.kicker == this.master) this.followBall = true
      
      if (this.ball.owner == -1 && this.followBall) {
        if (this.ball.v > 0.01)
          arr.push(['Ball', this.ball, ['x', 'y', 'z', 'a', 's', 'v', 'vz']])
        else this.followBall = false
      }
      
      this.comm.publish(arr)

      this.comm.store()
      this.logic()    
      var delta = this.comm.delta(this.comm.now, this.comm.last)
      this.comm.remember()

      if (!func.isEmpty(delta)) {
        this.comm.storePub()
        var deltaPub = this.comm.delta(this.comm.pubNow, this.comm.pubLast)
        this.comm.rememberPub()
          
        if (!func.isEmpty(deltaPub)) {
          var serialized = this.comm.serialize(deltaPub)
          this.socket.send(serialized)
        }
      }
    }

    setTimeout(function() {
      self.loop(ms)
    }, ms)
  }
}

module.exports = Game
