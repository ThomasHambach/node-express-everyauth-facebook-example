var mongoose = require('mongoose')
    , UserModel = mongoose.model('UserModel')
/*
 * GET users listing.
 */

exports.index = function(req, res){
    UserModel.find(function(err,users){
        console.log(users);
    });
    res.send('user listing');
};
