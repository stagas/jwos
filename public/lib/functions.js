/*
 *
 *  Common functions and extensions
 *
 */

Number.prototype.__defineGetter__('F', function() { return parseFloat(this.toFixed(2)) })
Number.prototype.__defineGetter__('C', function() { return Math.floor(this * 100).toString(32) })
 
Math.PIHC = Math.PI / 180

Math.cosa = function(a) {
  return Math.round(Math.cos(a * Math.PIHC) * 10000) / 10000
}

Math.sina = function(a) {
  return Math.round(Math.sin(a * Math.PIHC) * 10000) / 10000
}

Math.sgn = function(a) {
  if (a<0) return -1
  else if (a>0) return 1
  else return 0
}

Array.prototype.random = function() {
  return this[Math.floor(Math.random() * this.length)]
}

exports.isEmpty = function(o) {
  for(var p in o) {
    if (o[p] != o.constructor.prototype[p])
      return false;
  }
  return true;
}

var clone = exports.clone = function(o) {
  if(o == null || typeof(o) != 'object')
    return o

  var temp = o.constructor()

  for(var k in o)
    temp[k] = clone(o[k])
    
  return temp
}

exports.randomProperty = function(o) {
  var result
    , count = 0

  for (var prop in o)
    if (Math.random() < 1/++count)
      result = prop
      
  return result
}

exports.rotate = function(a, cp, ar) {
  var newar = []
  
  for (var i=0; i<ar.length; i+=2) {
    newar.push( 
      { x: ((cp.x - ar[i]) * Math.cosa(a) - (cp.y - ar[i+1]) * Math.sina(a)) + cp.x 
      , y: ((cp.x - ar[i]) * Math.sina(a) + (cp.y - ar[i+1]) * Math.cosa(a)) + cp.y 
      }
    )
  }
  
  return newar
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

exports.isPointInPoly = function(poly, pt) {
  for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
    ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
    && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
    && (c = !c)
  return c
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/dot-line-length [rev. #1]

exports.dotLineLength = function(x, y, x0, y0, x1, y1, o) { 
  if(o && !(o = function(x, y, x0, y0, x1, y1) {
    if(!(x1 - x0)) return {x: x0, y: y}
    else if(!(y1 - y0)) return {x: x, y: y0}
    var left, tg = -1 / ((y1 - y0) / (x1 - x0))
    return {x: left = (x1 * (x * tg - y + y0) + x0 * (x * - tg + y - y1)) / (tg * (x1 - x0) + y0 - y1), y: tg * left - tg * x + y}
  }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))){
    var l1 = lineLength(x, y, x0, y0), l2 = lineLength(x, y, x1, y1)
    return l1 > l2 ? l2 : l1
  } else {
    var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1
    return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b)
  }
}

exports.lineLength = function(x, y, x0, y0) {
  return Math.sqrt((x -= x0) * x + (y -= y0) * y)
}

// creationix's fast Queue
var Queue = exports.Queue = function() {
  this.tail = [];
  this.head = to_array(arguments);
  this.offset = 0;
  // Lock the object down
  //Object.seal(this);
}

Queue.prototype = {
  shift: function shift() {
    if (this.offset === this.head.length) {
      var tmp = this.head;
      tmp.length = 0;
      this.head = this.tail;
      this.tail = tmp;
      this.offset = 0;
      if (this.head.length === 0) return;
    }
    return this.head[this.offset++];
  },
  push: function push(item) {
    return this.tail.push(item);
  },
  get length() {
    return this.head.length - this.offset + this.tail.length;
  }
}

// to_array from mranney / node_redis
var to_array = exports.to_array = function(args) {
    var len = args.length,
        arr = new Array(len), i;

    for (i = 0; i < len; i += 1) {
        arr[i] = args[i];
    }

    return arr;
}

var set_cookie = exports.set_cookie = function( name, value, exp_y, exp_m, exp_d, path, domain, secure ) {
  var cookie_string = name + "=" + escape ( value );

  if ( exp_y )
  {
    var expires = new Date ( exp_y, exp_m, exp_d );
    cookie_string += "; expires=" + expires.toGMTString();
  }

  if ( path )
        cookie_string += "; path=" + escape ( path );

  if ( domain )
        cookie_string += "; domain=" + escape ( domain );
  
  if ( secure )
        cookie_string += "; secure";
  
  document.cookie = cookie_string;
}

var get_cookie = exports.get_cookie = function( cookie_name ) {
  var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );

  if ( results )
    return ( unescape ( results[2] ) );
  else
    return null;
}