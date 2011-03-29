/*
 *
 *  Sprite
 *
 */

var Sprite = function(id, className, dims, map) {
  //id = id
  var obj = document.createElement('div')
  obj.setAttribute('id', id)
  obj.className = className
  obj.style.position = 'absolute'
  obj.style.width = dims.x + 'px'
  obj.style.height = dims.y + 'px'
  obj.style.marginTop = (dims.t || 0) + 'px'
  obj.style.marginLeft = (dims.l || 0) + 'px'
  obj.style.zIndex = 1
  
  document.body.appendChild(obj)

  this.object = document.getElementById(id)
  this.map = map
  this.dims = dims
  this.face = null
  this.frame = 0
  this.duration = 1
}

Sprite.prototype = {	
  animate: function(face) {
    if (typeof this.map[face] === 'undefined') return this.stand()

    this.face = face
    this.object.style.backgroundPosition = this.map[this.face][this.frame][3]
                                         + 'px '
                                         + (- ( this.map[this.face][this.frame][0] * this.dims.y 
                                              - this.map[this.face][this.frame][2] ) )
                                         + 'px'

    if (this.duration <= 1) {
      this.frame++
      if (this.frame >= this.map[this.face].length) this.frame = 0
      this.duration = this.map[this.face][this.frame][1]
    } else {
      this.duration--
    }
  }

, stand: function() {
    this.frame = 0
    this.duration = 1
    this.animate(this.face)
  }
}

module.exports = Sprite
