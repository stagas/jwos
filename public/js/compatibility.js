/*
 *
 *  Compatibility extensions
 *
 */
 
Object.keys = Object.keys || function(o) {
  var a = []
  for (var k in o) a.push(k)
  return a
}

Array.prototype.indexOf = Array.prototype.indexOf || function(obj, start) {
  for (var i = (start || 0), j = this.length; i < j; i++) {
    if (this[i] == obj) { return i }
  }
  return -1
}

Date.now = Date.now || function() { return +new Date() }
