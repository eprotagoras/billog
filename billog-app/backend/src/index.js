//import dependencies, loading all npm installed libraries
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// import dependencies for auth0
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// define new Express app
const app = express();

// define the array database 
// TODO: replace with real, relational database (ie. MongoDB)
const posts = [];

// call use method of express app to configure libraries
// enhance app security with Helmet
app.use(helmet());
// parse application/json content type
app.use(bodyParser.json());
// enable all CORS requests
app.use(cors());
// log HTTP requests
app.use(morgan('combined'));

// endpoint responsible of retrieving all posts and their respective number of comments
app.get('/', (req, res) => {
    const ps = posts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        comments: p.comments.length,
    }));
    res.send(ps);
});

// enpoint responsible for responding to requests with a single post and all its comments
app.get('/:id', (req, res) => {
    const post = posts.filter(p => (p.id === parseInt(req.params.id)));
    if (post.length > 1) return res.status(500).send();
    if (post.length === 0) return res.status(404).send();
    res.send(post[0]);
});

// express middleware that validates ID tokens
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://enming.auth0.com/.well-known/jwks.json`
    }),

    // validate the audience and the issuer
    audience: '9EgWOUQPXNQ0h9Q59kB3c9xRa7Vyysv3',
    issuer: `https://enming.auth0.com/`,
    algorithms: ['RS256']
});

// endpoint that activates on post http requests to take the body of the req and insert it as a new post
app.post('/', checkJwt, (req, res) => {
    const {title, content} = req.body;
    const newPost = {
        id: posts.length + 1,
        title,
        content,
        comments: [],
        author: req.user.name,
    };
    posts.push(newPost);
    res.status(200).send();
});

// endpoint for adding the body of a request as a specific comment to a post 
app.post('/comment/:id', checkJwt, (req, res) => {
    const {comment} = req.body;

    const post = posts.filter(p => (p.id === parseInt(req.params.id)));
    if (post.length > 1) return res.status(500).send();
    if (post.length === 0) return res.status(404).send();

    post[0].comments.push({
        comment,        
        author: req.user.name,
    });
    
    res.status(200).send();
});

// define port identity and listen 
const port = 8081;
app.listen(port, () => {
    console.log('listening on port ' + port);
});