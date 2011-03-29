/*
 *
 *  Team
 *
 */
 
var Team = function(team) {
  this.name = 'Team'
  
	var self = this
  this.team = team || ['home', 'away'].random()
	this.lineup = {}
}

Team.prototype = {
  hasPlayer: function(id) {
		return this.lineup.indexOf(id) >= 0
	}

, getClosest: function(x, y, excl) {
		var dx
      , dy
      , di
      , mindi = 18000
      , co
      
		for (var i in this.lineup) { //=0, l=this.lineup.length; i<l; i++) {
			if (i !== excl && typeof this.players[i] !== 'undefined') {
				dx = this.players[i].x
				dy = this.players[i].y
				di = Math.abs(Math.sqrt(Math.pow(x - dx, 2) + Math.pow(y - dy, 2)))
				if (di < mindi) {
					mindi = di
					co = i
				}
			}
		}
		return this.players[co]
	}
}

module.exports = Team
