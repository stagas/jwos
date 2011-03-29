var func = require('functions')

/* 
 *
 *  State
 *
 */

var State = function() {
  this.frame = 0

  // current and previous state arrays
	this.current = []
	this.previous = []

  this.subList = {}
  this.pubList = {}

  this.alias = {}
  
  this.history = {}
}

State.prototype = {
  clear: function() {
    this.current = []
    return this
  }

, remember: function() {
    // remember current state
    this.previous = this.current.slice(0)
    
    this.frame++
    this.history[this.frame] = this.current.slice(0)
    var keys = Object.keys(this.history)
    if (keys.length > 100) delete this.history[keys[0]]
    
    return this
  }

, setAlpha: function(frame) {
    this.previous = this.history[frame] || this.current.slice(0)
    this.alpha(1000 / 10)
  }
  
, add: function(obj, s) {
    // add a new frame to current state
    this.current.push({obj: obj, state: s})
  }

  // calculate alpha state position
, alpha: function(a) {
    // we need two to make an alpha
    if (this.current.length === 0 || this.previous.length === 0) return []

    // alpha state array
    var aState=[]
		
    // go through the previous state
    for (var i=0, l=this.previous.length; i<l; i++) {
    
      // alpha frame object
      var aFrame = {}
      
      // do we have everything?
      if (this.current && this.current[i] && this.current[i].state
          && this.previous && this.previous[i] && this.previous[i].state) {
        
        // go through the previous state properties
        for (var p in this.previous[i].state) {
        
          switch (typeof this.previous[i].state[p]) {
            case 'number':
            // linear interpolation with current state properties
            aFrame[p] = Math.round( ( this.current[i].state[p] * a )
                                  + ( this.previous[i].state[p] * (1 - a) ) 
                                  )
            break
            
            default:
            if (a >= 0.5) aFrame[p] = this.current[i].state[p]
            else aFrame[p] = this.previous[i].state[p]
            break
          }
          
        }
      }

      // if we're ok, push alpha frame to alpha state
      if (this.current && this.current[i] && this.current[i].obj) {
        aState.push({obj: this.current[i].obj, state: aFrame})
      }
    }

    return aState
  }

  // render a state array
, render: function(rState) {
    for (var i=0, l=rState.length; i<l; i++) {
      if (rState[i].obj) rState[i].obj.display(rState[i].state)
    }
  }
 
, subscribe: function(arr) {
    var obj = {}
    for (var i=arr.length; i--; ) {
      obj[arr[i]] = true
    }
    this.subscribed = obj     
  }
}

module.exports = State
