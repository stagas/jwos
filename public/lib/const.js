/*
 *
 *  Constants
 *
 */

exports.WELCOME = [
  '  Javascript World of Soccer'
, ''
, '  Controls:'
, ''
, '  h ..... Help'
, '  arrows / i-j-k-l ..... Control player'
, '  n ..... Change name (\'random\' works)'
, '  c ..... Randomize hair and skin colour'
, '  m ..... Monkey mode'
, '  z ..... Shoot (long press) / Pass (short press)'
].join('\n')
 
exports.HOST = 'localhost'
exports.PORT = 8080 // 80

exports.FLUSH_INTERVAL = 1000 / 60
exports.BALL_INTERVAL = 500
exports.PASSTO_TIMEOUT = 500
exports.KICK_TIMEOUT = 1000
exports.HANDLEKEYS_TIMEOUT = 1000

exports.SHOOT_THRESHOLD = 120
exports.KICK_POWER = 11
exports.PASS_POWER = 3
exports.RUN_SPEED = 3.75
exports.DRIBBLE_SPEED = 2.95

exports.GRAVITY = 0.090 // gravity
exports.FRICTION = 0.942 // ground friction
exports.AIR_FRICTION = 0.968 // air friction

exports.LOOKS = [
  'white_black'
, 'white_brown'
, 'white_blonde'
, 'black_black'
, 'black_brown'
, 'black_blonde'
] 
 
// Direction in radius
exports.DIRECTION = {
	'up': 270
, 'down': 90
, 'left': 180
, 'right': 0
, 'left + up': 225
, 'right + up': 315
, 'left + down': 135
, 'right + down': 45
, '' : null
}

// Direction by keys

exports.KEYS = {
  0: '' // still
, 1: 'left'
, 2: 'up'
, 3: 'left + up'
, 4: 'right'
, 5: 'left + right'
, 6: 'right + up'
, 7: '' // impossible
, 8: 'down'
, 9: 'left + down'
, 10: 'up + down'
, 12: 'right + down'
}

/*
 *
 *  Stadium
 *
 */

var Stadium = function() {
  this.bounds = {
    left: 102
  , top: 160
  , right: 1250
  , bottom: 1570 
  }
  
  this.post = {
    left: 602
  , middle: 672
  , right: 743
  , top: 228
  , bottom: 1506
  , z: 38
  , depthTop: 28
  , depthBottom: 23
  }
  
  this.posts = {
    vert: [
      {x: this.post.left, y: this.post.top}
    , {x: this.post.right, y: this.post.top}
    , {x: this.post.left, y: this.post.bottom}
    , {x: this.post.right, y: this.post.bottom}
    ]
    
  , horiz:
    [
      {y: this.post.top, z: this.post.z}
    , {y: this.post.bottom, z: this.post.z}
    ]
  }
}

exports.STADIUM = new Stadium()
