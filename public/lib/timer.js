/*
 *
 *  Timer
 *
 */
 
var Timer = function() {
  this.name = 'Timer'
  
	this.now = Date.now()
	this.before = this.now
	this.delta = 0
	this.accumulator = 0
}

Timer.prototype = {
  // calculate new tick
  tick: function() {
    this.now = Date.now()
    this.delta = this.now - this.before
    this.accumulator += this.delta
    this.before = this.now
  }

  // overflow timer based on given ms
, overflow: function(ms) {
    if (this.accumulator >= ms ) {
      this.accumulator -= ms
      return true
    }
    return false
  }

  // calculate alpha
, alpha: function(ms) {
    return (this.accumulator/ms)
  }
}

module.exports = Timer
