var func = require('functions')

/*
 *
 *  Camera
 *
 */

var Camera = function(props) {
  // bounce float (0..1 : larger = more bounce)
  this.bounce = 0.91
  
  // scaling (smaller = faster)
  this.scale = 415
  
  // xy coords
  this.x = 0
  this.y = 0
  
  // xy velocity
  this.vx = 0
  this.vy = 0
  
  // xy delta to target
  this.dx = 0
  this.dy = 0

  // property override
  for (var p in props) {
    this[p] = props[p]
  }
}

Camera.prototype = {
	update: function() {
    // calculate velocity
    this.vx = this.bounce * this.vx - (this.x - this.dx) / this.scale
    this.vy = this.bounce * this.vy - (this.y - this.dy) / this.scale
    
    // apply to coords but not if it's too small (so it doesn't flicker when being ~still)
    this.x += Math.abs(this.vx) < 0.3 ? 0 : this.vx
    this.y += Math.abs(this.vy) < 0.3 ? 0 : this.vy

    // return state
    return {x: this.x, y: this.y}
	}

,	display: function(a) {
    // scroll window to alpha state
    if (!isNaN(a.x) && !isNaN(a.y))
      window.scrollTo(Math.floor(a.x), Math.floor(a.y))
	}
}

module.exports = Camera
