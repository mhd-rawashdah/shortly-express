var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Click = require('./click');
var Link = require('./link.js');

// this model represent the users table in the db

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  clicks: function() {
    return this.hasMany(Click);
  },
   links: function() {
    return this.hasMany(Link);
  },
  
});

module.exports = User;