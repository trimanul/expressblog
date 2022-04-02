const express = require('express');
const session = require('express-session');
const { render, redirect, cookie } = require('express/lib/response');
const {body, validationResult} = require('express-validator');
const pgp = require('pg-promise')();
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(__dirname + '/public'));

var bodyParser = require('body-parser');
const { equal } = require('assert');
const { is } = require('express/lib/request');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

const db = pgp(`postgres://${process.env.BLOGDB_USERNAME}:${process.env.BLOGDB_PASSWORD}@localhost:5432/blogdb`);


app.use(session({
    store: new (require('connect-pg-simple')(session))({ pgPromise: db }),
    resave: false,
    saveUninitialized: true,
    secret: process.env.BLOG_SESSION_SECRET,

    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 2
    }
}));




app.get('/', (req, res) => {
    db.any('SELECT title AS title, content AS post_content, to_char(date_posted, \'DD.MM.YYYY\') AS date_posted, username AS author FROM posts JOIN users on owner_id=user_id;')
    .then((query) =>{
        let posts = query;
        if (req.session.activeUser){
            res.render('index', { posts: posts, is_logged: true, cur_user: req.session.activeUser})
        }
        else {
            res.render('index', {posts: posts, is_logged: false});
        }
    }
    );

});

app.get('/about', (req, res) => {
    if (req.session.activeUser){
        res.render('about', {is_logged: true, cur_user: req.session.activeUser})
    }
    else {
        res.render('about',{is_logged: false});
    }
});

app.get('/login', (req, res) => {
    if (req.session.activeUser){
        res.render('login', {is_logged: true, cur_user: req.session.activeUser})
    }
    else {
        res.render('login',{is_logged: false});
    }
});

app.post('/login', body('username').isAlphanumeric().escape(), body('password').escape(),  (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }


    db.oneOrNone(`SELECT username AS username, password AS password FROM users WHERE username=\'${req.body.username}\'`)
    .then( (query) => {
        if(!query) {
            return res.status(400).json({ errors: 'User not found' });
        }
        if (query.username == req.body.username) {
            bcrypt.compare(req.body.password, query.password)
            .then( (same) => {
                if (same) {
                    req.session.activeUser = req.body.username;
                    res.redirect('/');
                }

                else {
                    return res.status(400).json({ errors: 'Invalid password' });
                }
            });
        }
    });

});

app.get('/signin', (req, res) => {
    if (req.session.activeUser){
        res.render('signin', {is_logged: true, cur_user: req.session.activeUser})
    }
    else {
        res.render('signin',{is_logged: false});
    }
});

app.post('/signin', 
    body('email').isEmail().escape(), 
    body('username').isAlphanumeric().escape(),
    body('password').escape(),
    body('rep_password').escape(),

    (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.oneOrNone(`SELECT username as username FROM users WHERE username=\'${req.body.username}\'`)
    .then( (query) => {
        if (query) {
            return res.status(400).json({error:"Username taken"});
        }

        else {
            bcrypt.hash(req.body.password, 10, (err, hash) =>{
                db.none(`INSERT INTO users(username, email, password) VALUES(\'${req.body.username}\', \'${req.body.email}\', \'${hash}\')`)
                .then(  (query) => {
                    res.redirect('/');
                });
            });
            
        }
    });


});

app.get('/new_post', (req, res) => {
        res.render('new_post', {is_logged: true, cur_user: req.session.activeUser});
});

app.post('/new_post', 
    body('title').escape(),
    body('content').escape(),
    (req, res) => {
        db.one(`SELECT user_id AS user_id FROM users WHERE username=\'${req.session.activeUser}\';`)
        .then((query => {
            db.none(`INSERT INTO posts(title, content, date_posted, owner_id) VALUES(\'${req.body.title}\', \'${req.body.content}\', CURRENT_DATE, \'${query.user_id}\')`)
            .then( (query) => {
                    res.redirect('/');
                }   
            );
        }));
        
});

app.get('/logout', (req, res) => {
    delete req.session.activeUser;
    res.redirect('/');
});

app.get('/myposts', (req, res) => {
    db.any(`SELECT post_id AS post_id, title AS title, content AS post_content, to_char(date_posted, \'DD.MM.YYYY\') AS date_posted, username AS author FROM posts JOIN users on owner_id=user_id WHERE username=\'${req.session.activeUser}\';`)
    .then((query) =>{
        let posts = query;
        res.render('myposts', { posts: posts, is_logged: true, cur_user: req.session.activeUser});
    }
    );
});

app.get('/delete_post', (req, res) => {
    db.none(`DELETE FROM posts WHERE post_id=\'${req.query.post_id}\'`)
    .then(() => {
        res.redirect('/myposts');
    });
});

app.get('/alter_post', (req, res) => {
    db.one(`SELECT title AS title, content AS content FROM posts WHERE post_id=\'${req.query.post_id}\'`)
    .then((query) => {
        res.render('alter_post', {title: query.title, content: query.content, is_logged: true, cur_user: req.session.activeUser});
    });
});

app.post('/alter_post',
    body('title').escape(),
    body('content').escape(),
    (req, res) => {
    db.none(`UPDATE posts SET title=\'${req.body.title}\', content=\'${req.body.content}\' WHERE post_id=\'${req.query.post_id}\'`)
    .then((query) => {
        res.redirect('/myposts');
    });
});



app.listen(3000, () => {
    console.log('online')
});
