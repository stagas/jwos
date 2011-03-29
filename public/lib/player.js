/*
 *
 *  Player
 *
 */

var func = require('functions')
  , Sprite = require('sprite')
  , C = require('const')
  , STADIUM = C.STADIUM
  , DIRECTION = C.DIRECTION
  , KEYS = C.KEYS
  , LOOKS = C.LOOKS
  
var Player = function(id, x, y, looks) {
  this.id = id
  this.name = ''
  
  if (!looks) looks = LOOKS.random()
  this.looks = looks
  
  this.team = ['home', 'away'].random()

  this.sprite = new Sprite(
    'player_' + this.id.replace(/\s+/, '')
  , 'player ' + this.team + ' ' + this.looks
  , {x: 32, y: 40, t: -31, l: -11} // xy dimensions and top left margins
  , {
      'up' : [
        [0,10,4,2] // [sprite frame #, duration, x offset, y offset]
      , [1,10,4,0]
      , [0,10,4,2]
      , [2,10,4,4]
      ]
    , 'down' : [
        [3,10,4,2]
      , [4,10,4,4]
      , [3,10,4,2]
      , [5,10,4,0]
      ]
    , 'right' : [
        [6,10,4,6]
      , [7,10,4,2]
      , [6,10,4,6]
      , [8,10,4,4]
      ]
    , 'left' : [
        [9,10,4,6]
      , [10,10,4,4]
      , [9,10,4,6]
      , [11,10,4,4]
      ]
    , 'left + down' : [
        [13,10,4,8]
      , [12,10,4,6]
      , [13,10,4,8]
      , [14,10,4,4]
      ]
    , 'right + down' : [
        [16,10,4,4]
      , [15,10,4,4]
      , [16,10,4,4]
      , [17,10,4,2]
      ]
    , 'left + up' : [
        [19,10,4,8]
      , [18,10,4,4]
      , [19,10,4,8]
      , [20,10,4,6]
      ]
    , 'right + up' : [
        [22,10,4,4]
      , [21,10,4,2]
      , [22,10,4,4]
      , [23,10,4,4]
      ]
    }
  )

  this.sprite.face = func.randomProperty(this.sprite.map)

  this.bounds = STADIUM.bounds

  // actual sprite position
  this.x = x || (Math.random()*(this.bounds.right - this.bounds.left)) + this.bounds.left
  this.y = y || (Math.random()*(this.bounds.bottom - this.bounds.top)) + this.bounds.top

  // walk to xy
  this.wtx = this.x
  this.wty = this.y
  
  this.keys = 0

  this.feet = []

  this.vx = 0
  this.vy = 0

  this.a = 0

  this.monkey = false
  this.monkeyDate = Date.now()

  this.walks = 0

  this.runSpeed = C.RUN_SPEED
  this.dribbleSpeed = C.DRIBBLE_SPEED

  this.speed = this.runSpeed

  this.magnet = 0.1
  
  this.direction = ''
  this.olddirection = ''
  
  this.dribbling = false
  this.shoot = 0
  this.kicks = 0
  this.passes = 0

  this.kickPower = C.KICK_POWER
  this.passPower = C.PASS_POWER

  this.cpu = 0
  
  this.dieTimeout = null

  this.shootThreshold = C.SHOOT_THRESHOLD
  this.shootTimer = 0
  this.shootTimeout = 0
  
  return this
}

Player.prototype = {
  switchLooks: function() {
    var classNameOld = this.sprite.object.className
      , looks
      , master = false
    
    if (~classNameOld.indexOf('master')) master = true
    
    while (classNameOld === this.sprite.object.className) {
      looks = LOOKS.random()
      this.sprite.object.className = 'player ' + this.team + ' ' + looks + (master && ' master' || '')
    }

    this.looks = looks
  }
  
, switchMonkey: function() {
    this.monkey = !this.monkey
  }
  
, changeName: function(target, force) {
    name = ''
    while (!name.length) {
      var $span, random = false
      
      if (this.name && this.name.length) {
        $span = document.getElementById('name_' + this.id.replace(/\s+/, ''))
        $span.parentNode.removeChild($span)
      }
      
      name = target || !force && func.get_cookie('name')
        || prompt("What's your name?")
        
      if (name == 'random')
        random = true
      , name = 
          [ 'ronaldinho'
          , 'christiano ronaldo'
          , 'puyol'
          , 'xavi'
          , 'iniesta'
          , 'messi'
          , 'henry'
          , 'mario balotelli'
          , 'nani'
          , 'abidal'
          , 'ferdinand'
          , 'toure'
          ].random()

      $span = document.createElement('span')
      $span.setAttribute('id', 'name_' + this.id.replace(/\s+/, ''))
      $span.innerText = name
      this.sprite.object.appendChild($span)
      
      setTimeout(function() {
        $span.style.opacity = '1.0'
        $span.style.left = (-Math.floor($span.clientWidth / 2) + 10) + 'px'
      }, 300)
      
      if (random) name = 'random'
      
      this.name = name
      func.set_cookie('name', name)
    }
  }
, cpuWalkTo: function(x,y) {
		this.wtx = x
		this.wty = y
    this.cpu = 1
	}
	
, cpuWalk: function() {
		var xs = ''
      , ys = ''
      , dir = ''
	
		if (this.x + 10 < this.wtx) {
			xs = 'right'
		} else if (this.x - 10 > this.wtx) {
			xs = 'left'
		}
    
		if (this.y + 10 < this.wty) {
			ys = 'down'
		} else if (this.y - 10 > this.wty) {
			ys = 'up'
		}
		
		if (xs.length && ys.length) {
			dir = xs + ' + ' + ys
		} else if (xs.length && !ys.length) {
			dir = xs
		} else if (!xs.length && ys.length) {
			dir = ys
		}

		if (dir !== '') {
			if (this.keys == 0) {
        this.direction = dir
        this.walks = 0
      } else { 
        this.walks = 1
      }
		} else {
			//this.sprite.stand()
      //this.direction = ''
      //this.walks = false
		}
	}

, fixFeet: function() {
    var mv = 30
      , cx = this.x + (this.vx * 3.5) + (mv/3)
      , cy = this.y + (this.vy * 3) + (mv/2)
      , x0, y0, x1,y1, x2, y2, x3, y3
      
    /* var h = mv / Math.cosa(this.a)
    */

    x0 = cx
    y0 = cy
    x1 = x0 + (mv * 0.54)
    y1 = y0
    x2 = x1
    y2 = y0 - mv
    x3 = x0
    y3 = y2

    this.feet = func.rotate(this.a, {x: x0 - (mv/3), y: y0 - (mv/2)}, [x0,y0, x1,y1, x2,y2, x3,y3])
  }

, update: function() {
    // if player is handled by cpu, get direction of movement
    if (this.cpu) {
      this.cpuWalk()
    }
    
    // animate sprite frame
    this.sprite.animate(this.direction)
    
    // if player is moving
    if (this.direction !== '') {
      this.speed = this.dribbling ? this.dribbleSpeed : this.runSpeed
      this.walks = 1
      
      // get angle of direction in degrees
      this.a = DIRECTION[this.direction]
    
      // calculate velocities
      this.vx = this.speed * Math.cosa(this.a)
      this.vy = this.speed * Math.sina(this.a)

      // add velocities to position
      this.x += this.vx
      this.y += this.vy
    
      // but keep inside boundaries
      if (this.x < this.bounds.left) this.x = this.bounds.left
      if (this.x > this.bounds.right) this.x = this.bounds.right
      if (this.y < this.bounds.top) this.y = this.bounds.top
      if (this.y > this.bounds.bottom) this.y = this.bounds.bottom

      // calculate new feet position
      this.fixFeet()
    } else {
      this.walks = 0
    }

    // return state
    return {x: this.x, y: this.y }
  }
	
, display: function(a) {
    this.sprite.object.style.left = a.x + 'px'
    this.sprite.object.style.top = a.y + 'px'
    this.sprite.object.style.zIndex = Math.floor(a.y)
  }
}

module.exports = Player


/*
    if (!this.monkey)
      this.handleKeys()
    else {
      if (new Date() - this.monkeyDate > Math.random() * 10000) {
        this.monkeyDate = new Date()
        //this.direction = getRandomProperty(Direction)
        //if (Math.random() * 10000 < 2000) 
        var dx = ball.x - this.x
          , dy = ball.y - this.y
          , dist = Math.sqrt(dx*dx + dy*dy)

        //console.log(dist)
        if (dist < 300 && dist > 10) {
          if (Math.random() * 10000 < 1000) this.cpuWalkTo(ball.x, ball.y)
        }
        
        if ((master.team.home_away === this.team.home_away) && dist > 800) {
          if (Math.random() * 10000 < 5000) this.cpuWalkTo(ball.x, ball.y )
        }        
        
      if (Math.abs(this.wtx-this.x) > 6 && Math.abs(this.wty-this.y) > 6 && master !== this) {
        if (master.team.home_away != this.team.home_away) {
          this.cpuWalkTo(ball.x, ball.y)
          this.cpuWalk()
        }
        if (Math.abs(this.wtx-this.x) > 200 && Math.abs(this.wty-this.y) > 200 && master !== this) {
          this.cpuWalkTo(ball.x, ball.y)
          this.cpuWalk()
          //this.cpuWalkTo(this.x, this.y)
        }
      } else {
        
        //if (master.team.home_away === this.team.home_away) {
          //this.cpuWalkTo(ball.x, ball.y)
        //}
        if (this.keys == 0 && master !== this) this.direction = ''
        //if (master.team.home_away != this.team.home_away && this.keys == 0) this.direction = ''
        
        //this.sprite.stand()
      }
      
      }
      //console.log(this.wtx, this.x)

    }
    */
    
          /* if (this.home_away === master.home_away) {
        if (master != this) {      
          master = this
          oldClass = master.sprite.object.className
          oldClassArr = oldClass.split(' ')
          oldClassArr.push('master')
          master.sprite.object.className = oldClassArr.join(' ')
        }
        master.monkey = false 
      } */
			//ball.setOwner(this.id)
			
      		/*if (game.passTo != this.id) {
			if (this.direction !== '') {
				this.sprite.animate(this.direction)
			} else {
				this.sprite.stand()
			}
		} else {
      console.log('I SHOULD BE WALKING')
			this.cpuWalkTo(ball.x, ball.y)
			this.cpuWalk()
		}*/

        //if (game.passTo == master.id) console.log('HEY I GET THE PASS')
    //if (game.passTo != this.id) this.handleKeys()

