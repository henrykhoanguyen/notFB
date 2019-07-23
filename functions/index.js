const functions = require('firebase-functions');

// const express = require('express);
// const app = express();
const app = require('express')();

// Authenticator Middleware
const FBAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login } = require('./handlers/users');

// Scream Routes
app.get('/screams', getAllScreams);         // Get All Screams
app.post('/scream', FBAuth, postOneScream); // Post One Scream
// User Routes
app.post('/signup', signup);                // Signup 
app.post('/login', login);                  // Login

exports.api = functions.https.onRequest(app);