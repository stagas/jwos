#!/usr/local/bin/node
var func = require('./public/lib/functions')
var im   = require('imagemagick')

var source = './public/player_vertical_stripes.png'

var teams = {

  barcelona: {
        name: 'FC Barcelona'
  , stripe_one: '#114D95'
  , stripe_two: '#8D0044'
  ,     shorts: '#114D95'
  ,      socks: '#8D0044'
  }

, manutd: {
        name: 'Manchester United'
  , stripe_one: '#F00'
  , stripe_two: '#F00'
  ,     shorts: '#FFF'
  ,      socks: '#000'
  }

, chelsea: {
        name: 'Chelsea FC'
  , stripe_one: '#2735DF'
  , stripe_two: '#2735DF'
  , shorts: '#2735DF'
  , socks: '#FFF'
  }

, greece: {
        name: 'Greece'
  , stripe_one: '#2e31c2'
  , stripe_two: '#2e31c2'
  ,     shorts: '#2e31c2'
  ,      socks: '#ffffff'
  }

, brazil: {
        name: 'Brazil'
  , stripe_one: '#ffff26'
  , stripe_two: '#ffff26'
  ,     shorts: '#104c9a'
  ,      socks: '#104c9a'
  }
}

var home = process.argv.length > 2 && teams[process.argv[2]] || teams[func.randomProperty(teams)]
  , away = process.argv.length > 3 && teams[process.argv[3]] || teams[func.randomProperty(teams)]

var hairs = {
  black: {
     name: 'black'
  , light: '#444'
  , color: '#222'
  ,  dark: '#000'
  }
  
, brown: {
     name: 'brown'
  , light: '#AB8561'
  , color: '#70412D'
  ,  dark: '#3D2218'
  }
  
, blonde: {
     name: 'blonde'
  , light: '#CFAF89'
  , color: '#B68959'
  ,  dark: '#683A19'
  }  
}

var skins = {
  white: {
       name: 'white'
  ,   color: '#FC6C00'
  ,    dark: '#B44800'
  , darkest: '#6C2400'
  }
  
, black: {
       name: 'black'
  ,   color: '#774C33'
  ,    dark: '#6A4133'
  , darkest: '#38211F'
  }
}

var combinations = [
  [ skins.white, hairs.black  ]
, [ skins.white, hairs.brown  ]
, [ skins.white, hairs.blonde ]
, [ skins.black, hairs.black  ]
, [ skins.black, hairs.brown  ]
, [ skins.black, hairs.blonde ]
]

var convert = function(source, target, team) {
  combinations.forEach(function(comb) {
    var skin = comb[0]
      , hair = comb[1]
      
    im.convert(

      [ source

      // stripe one
      , '-fill', team.stripe_one
      , '-draw', 'color 5,13 replace'

      // stripe two
      , '-fill', team.stripe_two
      , '-draw', 'color 7,13 replace'

      // shorts
      , '-fill', team.shorts
      , '-draw', 'color 5,19 replace'

      // socks
      , '-fill', team.socks
      , '-draw', 'color 5,25 replace'
      
      
      // hair light
      , '-fill', hair.light
      , '-draw', 'color 7,5 replace'
      
      // hair color
      , '-fill', hair.color
      , '-draw', 'color 7,7 replace'

      // hair dark
      , '-fill', hair.dark
      , '-draw', 'color 11,9 replace'
      
      
      // skin color
      , '-fill', skin.color
      , '-draw', 'color 7,129 replace'

      // skin dark
      , '-fill', skin.dark
      , '-draw', 'color 11,129 replace'
      
      // skin darkest
      , '-fill', skin.darkest
      , '-draw', 'color 11,103 replace'
      
      , target + '_' + skin.name + '_' + hair.name + '.png'
      ]
      
    , function(err, stdout) {
        if (err) throw err
        console.log('OK', team.name)
      }
    )
  })
}

convert(source, 'public/player_home', home)
convert(source, 'public/player_away', away)
