var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));



/// Note: we call the util.checkUser function inside our reqest method to check on the session

app.get('/', util.checkUser, function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser,function(req, res) {
  res.render('index');
});

app.get('/links', util.checkUser,function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', util.checkUser, function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// import the session module ;

var session = require ('express-session');

app.use(session({

  secret: "nsnsdsodjsaduaspdumdfio[dysfysdfi[ohdfo['dhdff",
  resave: false,
  saveUninitialized: true
}));



app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  // check if the username and password exist or not 
  util.isUserExist(req.body.username, function(model){
    if(model){
      bcrypt.compare(req.body.password, model.get('password'), function(err, result) {
        if(result){
           console.log(result);
          // render the index
          util.createSession(req, res,  req.body.username);
        } else {
         //res.redirect('/login');
          res.send('password or username not correct')
        }
      });
    } else {
      //res.redirect('/login');
      res.send('username not found');
    }
  })

});

//get requst to signup  and render the signup page
app.get('/signup', function(req, res){
  res.render('signup');
});

app.post('/signup', function(req, res){
  // to encryt the password
  var hashPassword = '';
  util.hashPassword(req.body.password, function(hash){
    hashPassword = hash;
  })

  // check on the user exist or not
   util.isUserExist(req.body.username, function(model){
    if (!model) {
      // add the data to the user table
      new User({ username: req.body.username, password: hashPassword}).save().then(function(){
        util.createSession(req, res,  req.body.username);
      });
    } else {
      //res.redirect('/signup');
      //console.log('The User Already exist');
      res.send('The User Already exist');
    }
   });
    
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
