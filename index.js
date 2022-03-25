const express = require('express');
const { render } = require('express/lib/response');

const app = express();

const dummy_data = [
{
    id : 1,
    author : 'dummy',
    title : 'First post',
    text : 'First blog post!!',
    date : '22.03.2022'
},

{
    id : 2,
    author : 'dummy',
    title : 'Second post',
    text : 'Second blog post!!',
    date : '22.03.2022'
},

{
    id : 3,
    author : 'dummy',
    title : 'Third post',
    text : 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolorum explicabo optio consequuntur fuga voluptate consequatur quam incidunt a, numquam est.',
    date : '22.03.2022'
},

{
    id : 4,
    author : 'dummy',
    title : '4 post',
    text : 'Second blog post!!',
    date : '22.03.2022'
},

{
    id : 5,
    author : 'dummy',
    title : '5 post',
    text : 'Second blog post!!',
    date : '22.03.2022'
},

{
    id : 5,
    author : 'dummy',
    title : '5 post',
    text : 'Second blog post!!',
    date : '22.03.2022'
},
{
    id : 5,
    author : 'dummy',
    title : '5 post',
    text : 'Second blog post!!',
    date : '22.03.2022'
},
{
    id : 5,
    author : 'dummy',
    title : '5 post',
    text : 'Second blog post!!',
    date : '22.03.2022'
}

]

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
    res.render('index', {posts: dummy_data});
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signin', (req, res) => {
    res.render('signin');
});


app.listen(3000, () => {
    console.log('online')
});