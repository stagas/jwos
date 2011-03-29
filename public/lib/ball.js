var func = require('functions')
  , CONST = require('const')
  , stadium = CONST.STADIUM
  , DIRECTION = CONST.DIRECTION

/*
 *
 *  Ball
 *
 */
 
var Ball = function(props) {
  this.name = 'Ball'
  
  // get ball and shadow dom elements
  this.ball = document.getElementById('ball')
  this.shadow = document.getElementById('ball_shadow')

	this.g = CONST.GRAVITY // gravity
	this.f = CONST.FRICTION // ground friction
	this.af = CONST.AIR_FRICTION // air friction
	
  this.a = 0 // angle
  this.s = 0 // spin
  
  // xyz coords
	this.x = 200
	this.y = 200
	this.z = 0

  this.v = 0 // xy velocity
	this.vz = 0 // z velocity
  
  // xy velocity splitted
	this.vx = 0
	this.vy = 0

  // is ball in nets
  this.nets = false
  
  // is ball out
  this.out = false
  
  // who's control of the ball
  this.owner = -1
  this.previousOwner = -1
  
  this.game = null
  
  // who kicked the ball and where
  //this.kicker = null
  //this.kickDirection = ''
	
  // property override
  for (var p in props) {
    this[p] = props[p]
  }
  
	return this  
}

Ball.prototype = {
  // examine collision with boundaries and physical objects
  hitBounds: function() {
    // bounce determining helper boolean
    var bounce = false
    
    //
    // stadium boundaries bounce
    //
    
    if (this.x - 4 < stadium.bounds.left)
      this.vx = -this.vx, this.x = stadium.bounds.left + 4, bounce=true
    else if (this.x+4 > stadium.bounds.right)
      this.vx = -this.vx, this.x = stadium.bounds.right - 4, bounce=true
      
    if (this.y-4 < stadium.bounds.top)
      this.vy = -this.vy, this.y = stadium.bounds.top + 4, bounce=true
    else if (this.y+4 > stadium.bounds.bottom)
      this.vy = -this.vy, this.y = stadium.bounds.bottom - 4, bounce=true
    
    // if we bounced, calculate new angle and dampen velocity
    if (bounce) {
      this.a = Math.atan2(this.vy, this.vx) * 180 / Math.PI
      this.v *= 0.8
    }

    // reset bounce helper
    bounce = false
    
    // is the ball in nets area?
    if (this.y-4 < stadium.post.top && this.y+4 > stadium.post.top - stadium.post.depthTop
     && this.x-4 > stadium.post.left && this.x+4 < stadium.post.right
     && this.z-4 < stadium.post.z) {
      this.nets = true
    }

    if (this.y+4 > stadium.post.bottom && this.y-4 < stadium.post.bottom + stadium.post.depthBottom
     && this.x-4 > stadium.post.left && this.x+4 < stadium.post.right
     && this.z-4 < stadium.post.z) {
      this.nets = true
    }

    //
    // posts bounce
    //

    // iterate through posts and do simple circle to circle collision
  
    var post, dx, dy, dist, angle, rangle, sx, sy
      , minDist = 7
    
    for (var i=stadium.posts.vert.length; i--;) {
      post = stadium.posts.vert[i]
      
      dx = post.x - this.x
      dy = post.y - this.y
      dist = Math.sqrt(dx*dx + dy*dy)

      if (this.z - 7 < stadium.post.z && dist < minDist) {
        angle = Math.atan2(dy, dx) * 180 / Math.PI
        this.x += Math.cos(angle) * (minDist - dist)
        this.y += Math.sin(angle) * (minDist - dist)
        sx = this.x - post.x
        sy = this.y - post.y
        
        this.a = Math.atan2(sy, sx) * 180 / Math.PI
      }
    }
    
    for (var i=stadium.posts.horiz.length; i--;) {
      post = stadium.posts.horiz[i]
      
      dz = post.z - this.z
      dy = post.y - this.y
      dist = Math.sqrt(dz*dz + dy*dy)

      if (this.x - 7 > stadium.post.left && this.x + 7 < stadium.post.right && dist < minDist) {
        angle = Math.atan2(dy, dz) * 180 / Math.PI
        this.z += Math.cos(angle) * (minDist - dist)
        this.y += Math.sin(angle) * (minDist - dist)
        sz = this.z - post.z
        sy = this.y - post.y
        
        rangle = Math.atan2(sy, sz) * 180 / Math.PI
        
        this.vz = this.vx * Math.cosa(rangle)
        this.vy = this.v * Math.sina(rangle)
        
        this.v = Math.sqrt(this.vx*this.vx + this.vy*this.vy)
        
        this.a = Math.atan2(this.vy, this.vx) * 180 / Math.PI
      }
    }
    
    if ( (this.x - 4 > stadium.post.right || this.x + 4 < stadium.post.left)
       && (this.y - 4 < stadium.post.top || this.y + 4 > stadium.post.bottom)
       ) this.out = true

    if (this.out && this.nets) {
      if (this.x - 4 < stadium.post.right && this.x + 4 > stadium.post.right - 4)
        this.vx -= this.vx * 0.04, this.x = stadium.post.right + 4, bounce = true
      else if (this.x + 4 > stadium.post.left && this.x - 4 <= stadium.post.left + 4)
        this.vx -= this.vx * 0.04, this.x = stadium.post.left - 4, bounce = true
      
      if (this.y + 4 > stadium.post.top - stadium.post.depthTop && this.y + 4 < stadium.post.top)
        this.vy = -this.vy * 0.04, this.y = stadium.post.top - stadium.post.depthTop - 4
      else if (this.y - 4 < stadium.post.bottom + stadium.post.depthBottom && this.y - 4 > stadium.post.bottom)
        this.vy = -this.vy * 0.04, this.y = stadium.post.bottom + stadium.post.depthBottom + 4

      bounce = true
      
      this.nets = false
    }
    
    /*{
      if (this.x + 4 > stadium.post.left)
        this.vx = -this.vx * 0.02, this.vy *= 1.21, this.x = stadium.post.left - 4, bounce = true
      else if (this.x - 4 < stadium.post.right)
        this.vx = -this.vx * 0.02, this.vy *= 1.21, this.x = stadium.post.right - 4, bounce = true
      
      if (this.y + 4 > stadium.post.top - stadium.post.depthTop)
        this.vy = -this.vy * 0.02, this.vx *= 1.21, this.y = stadium.post.top - stadium.post.depthTop - 4, bounce = true
        
      if (this.y - 4 < stadium.post.bottom + stadium.post.depthBottom)
        this.vy = -this.vy * 0.02, this.vx *= 1.21, this.y = stadium.post.bottom + stadium.post.depthBottom + 4, bounce = true
        
      // if ball hits the nets ceiling, put it back in, calculate nets curve and kill z velocity
      if (this.y - 4 < stadium.post.top || this.y + 4 > stadium.post.bottom) {
        if (this.z - 4 < stadium.post.z) {
          this.z = stadium.post.z * 1.21
          this.vz = 0
        }
      }
      
      // if we bounced calculate new angle, and dampen velocities
      if (bounce) {
        this.a = Math.atan2(this.vy, this.vx) * 180 / Math.PI
        this.v = Math.sqrt(this.vx*this.vx + this.vy*this.vy) * 0.85
        if (this.vz > 0) this.vz *= 0.5
      }      
    } */
    
    // are we in the nets area at all?
    if (this.nets && !this.out) {

      //
      // nets bounce and keeping it inside
      //

      // keep the ball in nets and calculate net collision behaviour
      if (this.x - 4 < stadium.post.left)
        this.vx = -this.vx * 0.02, this.vy *= 1.21, this.x = stadium.post.left + 4, bounce=true
      else if (this.x + 4 > stadium.post.right)
        this.vx = -this.vx * 0.02, this.vy *= 1.21, this.x = stadium.post.right - 4, bounce=true
        
      if (this.y - 4 < stadium.post.top - stadium.post.depthTop)
        this.vy = -this.vy * 0.02, this.vx *= 1.21, this.y = stadium.post.top - stadium.post.depthTop + 4, bounce=true

      if (this.y + 4 > stadium.post.bottom + stadium.post.depthBottom)
        this.vy = -this.vy * 0.02, this.vx *= 1.21, this.y = stadium.post.bottom + stadium.post.depthBottom - 4, bounce=true
      
      // if ball hits the nets ceiling, put it back in, calculate nets curve and kill z velocity
      if (this.y - 4 < stadium.post.top) {
        if (this.z-4 > stadium.post.z - ((stadium.post.top - this.y) * 0.65)) {
          this.z = stadium.post.z - ((stadium.post.top - this.y) * 0.65)
          this.vz = 0
        }
      }

      if (this.y + 4 > stadium.post.bottom) {
        if (this.z-4 > stadium.post.z - ((stadium.post.bottom - this.y) * 0.65)) {
          this.z = stadium.post.z - ((stadium.post.bottom - this.y) * 0.65)
          this.vz = 0
        }
      }
    }

    // if we bounced calculate new angle, and dampen velocities
    if (bounce) {
      this.a = Math.atan2(this.vy, this.vx) * 180 / Math.PI
      this.v = Math.sqrt(this.vx*this.vx + this.vy*this.vy) * 0.85
      if (this.vz > 0) this.vz *= 0.5
    }
      
    // not in nets any more
    if (this.y - 4 > stadium.post.top && this.y + 4 < stadium.post.bottom) this.nets = false, this.out = false

	}
	
, afterTouch: function() {
    if (this.game.kicker == -1) return
  
    var kicker = this.game.players[this.game.kicker]
    if (!kicker) return

    // is it kicked and is user swerving?
		if (kicker.direction != '' && kicker.walks) {
      //state.subscribe(['Player'])		

      // calculate difference in degrees
      var dif = ((this.a - DIRECTION[kicker.direction] + 540) % 360) - 180
        , adif = Math.abs(dif)
        , l = 0
        , s = 0

      // get swerve and lob by degree difference
      if (adif >= 0 && adif < 90) {
        s = 1.57
        l = 0.10
        this.v += (this.v) * 0.014
      } else if (adif >= 90 && adif < 135) {
        s = 0.93
        l = 0.69
        this.v += (this.v) * 0.009
      } else if (adif >= 135) {
        s = l = 1
      }

      var powr = Math.min(this.v * l * 0.0227, 0.10)

      // apply lob
      this.vz += powr //this.v * l * 0.0198

      // apply swerve
      //if (adif > 0 && adif < 180)
        this.s += this.v * 0.0023 * s * -Math.sgn(dif)
    }
	}
	
, update: function() {
    //var pos = this.buffer.shift()

    this.a += this.s // apply swerve to angle
    this.s *= 0.975 // dampen swerve force
    this.afterTouch() // calculate aftertouch
    this.vz -= this.g // apply gravity
    this.z += this.vz // apply z force

    // bounce on grass
    if (this.z < 0) {
      this.vz = -this.vz * 0.76 // reverse and dampen z velocity      
      this.z = 0 // make sure we aren't below ground
      
      // this prevents further aftertouch on the ball
      this.kickDirection = ''
    }

    this.v += this.z * 0.0012 // transfer a bit of z to xy velocity

    // calculate new xy velocities
    this.vx = this.v * Math.cosa(this.a)
    this.vy = this.v * Math.sina(this.a)
    
    // apply xy velocities
    this.x += this.vx
    this.y += this.vy

    // dampen velocity by friction or air friction
    this.v *= (this.z<=0.1) ? this.f : this.af

    // reset swerve
    if (this.v <= 0.01) this.s = 0

    // check if ball hits any bounds or physical objects
    this.hitBounds()

    // return state
    return {x: this.x, y: this.y, z: this.z}
  }

, display: function(a) {
    // change ball position
    this.ball.style.left = a.x + 'px'
    this.ball.style.top = (a.y-a.z) + 'px'
    this.ball.style.zIndex = Math.floor(a.y + 2)

    // change shadow position
    this.shadow.style.left = (a.x + a.z + 2) + 'px'
    this.shadow.style.top = (a.y + (a.z/4) + 2) + 'px'
  }
}

module.exports = Ball
