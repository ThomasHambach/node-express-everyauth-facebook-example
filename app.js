/**
 * Module dependencies.
 */
var appPath = __dirname + '/app'
    , express = require('express')
    , http = require('http')
    , path = require('path')
    , fs = require('fs')
    , mongoose = require('mongoose')
    , everyauth = require('everyauth');

// if you like to see what is going on, set this to true
everyauth.debug = false;

/** Connect to database and load models **/
mongoose.connect('mongodb://127.0.0.1/mymongodb');
var models_path = appPath + '/models';
fs.readdirSync(models_path).forEach(function (file) {
    require(models_path+'/'+file)
});
var UserModel = mongoose.model('UserModel');

/**
 * Social login integration using Facebook
 */
everyauth.everymodule.findUserById(function(userId,callback) {
    UserModel.findOne({facebook_id: userId},function(err, user) {
        callback(user, err);
    });
});
everyauth.facebook
    .appId('YOUR APP ID')
    .appSecret('YOUR APP SECRET')
    .scope('email,user_location,user_photos,publish_actions')
    .handleAuthCallbackError( function (req, res) {
        res.send('Error occured');
    })
    .findOrCreateUser( function (session, accessToken, accessTokExtra, fbUserMetadata) {

        var promise = this.Promise();
        UserModel.findOne({facebook_id: fbUserMetadata.id},function(err, user) {
            if (err) return promise.fulfill([err]);

            if(user) {

                // user found, life is good
                promise.fulfill(user);

            } else {

                // create new user
                var User = new UserModel({
                    name: fbUserMetadata.name,
                    firstname: fbUserMetadata.first_name,
                    lastname: fbUserMetadata.last_name,
                    email: fbUserMetadata.email,
                    username: fbUserMetadata.username,
                    gender: fbUserMetadata.gender,
                    facebook_id: fbUserMetadata.id,
                    facebook: fbUserMetadata
                });

                User.save(function(err,user) {
                    if (err) return promise.fulfill([err]);
                    promise.fulfill(user);
                });

            }


        });

        return promise;
    })
    .redirectPath('/');

/**
 * Start and setup express
 * @type {*}
 */
var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', appPath + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('super secret'));
  app.use(express.session());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(everyauth.middleware(app)); // important to call this AFTER session!
  app.use(app.router);

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * Routing to "controllers", seems important that we only include
 * our controllers at this point, or our models will not be passed
 * to them.
 */
var index = require(appPath + '/controllers/index')
    , user = require(appPath + '/controllers/user');
app.get('/', index.index);
app.get('/user',user.index);

/**
 * Start listening
 */
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
