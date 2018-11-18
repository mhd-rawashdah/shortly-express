var db = require('../config');
var Link = require('./link.js');

// this model represent the table Click in the db
var Click = db.Model.extend({
  tableName: 'clicks',
  hasTimestamps: true,
  link: function() {
    return this.belongsTo(Link, 'linkId');
  }
});

module.exports = Click;
