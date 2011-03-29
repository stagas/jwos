if (typeof require.paths !== 'undefined')
  require.paths.unshift('./public/lib')

var func = require('functions')

/*
 *
 *  Comm
 *
 */

var Comm = function(c) {
  this.c = c
  this.watching = []
  this.publishing = []
  this.now = {}
  this.last = {}
  this.pubNow = {}
  this.pubLast = {}
  this.aliasObj = {}
  this.aliasProp = {}
  this.aliasObjRev = {}
  this.aliasPropRev = {}  
}
 
Comm.prototype = {
  alias: function(obj, prop) {
    this.aliasObj = obj
    this.aliasProp = prop
    for (var k in obj) {
      this.aliasObjRev[obj[k]] = k
    }
    for (var k in prop) {
      this.aliasPropRev[prop[k]] = k
    }
  }
  
, watch: function(arr) {
    this.watching = []
    for (var i=0; i<arr.length; i++) {
      this.watching.push([arr[i][0], arr[i][1], arr[i][2]])
    }
  }

, publish: function(arr) {
    this.publishing = []
    for (var i=0; i<arr.length; i++) {
      this.publishing.push([arr[i][0], arr[i][1], arr[i][2]])
    }
  }
  
, remember: function() {
    this.last = func.clone(this.now)
  }

, rememberPub: function() {
    this.pubLast = func.clone(this.pubNow)
  }
  
, store: function() {
    var s = {}
      , obj, props, name, prop
      
    for (var o=0; o<this.watching.length; o++) {
      name = this.watching[o][0]
      obj = this.watching[o][1]
      s[name] = {}
      props = this.watching[o][2]
      for (var p=0; p<props.length; p++) {
        prop = props[p]
        s[name][prop] = obj[prop]
      }
    }

    this.now = s
  }

, storePub: function() {
    var s = {}
      , obj, props, name, prop
      
    for (var o=0; o<this.publishing.length; o++) {
      name = this.publishing[o][0]
      obj = this.publishing[o][1]
      s[name] = {}
      props = this.publishing[o][2]
      for (var p=0; p<props.length; p++) {
        prop = props[p]
        s[name][prop] = obj[prop]
      }
    }

    this.pubNow = s
  }
  
, delta: function(now, last) {
    var s = {}
      , nop, obj
      , objAlias, propAlias
    
    for (var o in now) {
      objAlias = this.aliasObj[o] || o
      for (var p in now[o]) {
        nop = now[o][p]
        propAlias = this.aliasProp[p] || p
        if (typeof last[o] != 'undefined' && typeof last[o][p] != 'undefined') {
          if (typeof nop !== 'undefined' && nop !== null && (propAlias.toLowerCase() == propAlias ? (nop.F).C != (last[o][p].F).C : nop != last[o][p])) {
            if (typeof s[objAlias] === 'undefined') s[objAlias] = {}
            //if (typeof s[objAlias][propAlias] !== 'undefined') {
              if (propAlias.toLowerCase() == propAlias) {
                s[objAlias][propAlias] = (nop.F).C  //  - last[o][p]
              } else {
                s[objAlias][propAlias] = nop
              }
            //}
            //s[objAlias][propAlias]
          }
        } else {
          if (typeof nop !== 'undefined' && nop !== null) {
            if (typeof s[objAlias] === 'undefined') s[objAlias] = {}
            //if (typeof s[objAlias][propAlias] !== 'undefined') {
              if (propAlias.toLowerCase() == propAlias) {
                s[objAlias][propAlias] = (nop.F).C  //  - last[o][p]
              } else {
                s[objAlias][propAlias] = nop
              }
            //}
          }
        }
      }
    }

    return s
  }
  
, serialize: function(s) {
    var z = []

    for (var o in s) {
      z.push(':' + o)
      for (var p in s[o]) {
        z.push(p, s[o][p])
        z.push('|')
      }
    }
    z = z.join('')
    return z.substr(0, z.length - 1)
  }
  
, deserialize: function(z) {
    var self = this
      , s = {}
      , ot, pt
      , o, p
      , d = []
      , prop
      , objAlias, propAlias
    
    z = z.split('|')
    
    ot = false
    ;(function next(i) {
      if (i == z.length) return

      pt = true
      for (var c=0; c<z[i].length; c++) {
        if (z[i].substr(c,1) == ':') {
          pt = false
          ot = true
          continue
        }
        if (pt) {
          p = z[i].substr(c,1)
          prop = z[i].substr(c+1)
          //c = c.length
          break
        }
        if (ot) {
          o = z[i].substr(c,1)
          ot = false
          pt = true
          continue
        }
      }

      objAlias = typeof self.aliasObjRev[o] !== 'undefined' && self.aliasObjRev[o] || o
      propAlias = typeof self.aliasPropRev[p] !== 'undefined' && self.aliasPropRev[p] || p
      if (typeof s[objAlias] === 'undefined') s[objAlias] = {}
      if (typeof propAlias !== 'undefined' && p.toLowerCase() == p) {
        s[objAlias][propAlias] = parseInt(prop, 32)
        if (isNaN(s[objAlias][propAlias])) s[objAlias][propAlias] = 0
        s[objAlias][propAlias] /= 100
      } else {
        s[objAlias][propAlias] = prop
      }
      next(++i)
    }(0))
    //console.log(s)
    return s
  }
}

module.exports = Comm
