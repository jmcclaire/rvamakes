/**
 * Module dependencies.
 */

var express = require('express');

// set data connection
if (process.env.NODE_ENV == 'production') {
    db = require('./db');
}
else {
    db = require('./db-local');
}

var routes = require('./routes'),
    creative = require('./routes/creative'),
    http = require('http'),
    path = require('path'),
    db;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    secret: "this!secret!sucks!and!will^be^changed$for$production@bitches",
    cookie: {httpOnly: true}
}));
app.use(express.csrf());

app.use(function (req, res, next) {
    res.locals.csrftoken = req.session._csrf;
    next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}


// Creatives
app.get('/api/creatives', creative.index);
app.get('/api/creatives/:id', creative.show);
app.post('/api/creatives', creative.create);
app.delete('/api/creatives/:id', creative.delete);
app.delete('/api/creatives/reset', creative.reset);

// Root
app.get('/', routes.index);


http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
