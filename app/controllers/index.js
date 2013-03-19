var mongoose = require('mongoose')
    , UserModel = mongoose.model('UserModel');

/*
 * GET home page.
 */
exports.index = function(req, res){
    res.render('index', { title: 'Express' });
};