const functions = require('firebase-functions');

// const express = require('express);
// const app = express();
const app = require('express')();

// Authenticator Middleware
const FBAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const { 
    signup,
    login,
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser 
} = require('./handlers/users');

// Scream Routes
app.get('/screams', getAllScreams);             // Get All Screams
app.post('/scream', FBAuth, postOneScream);     // Post One Scream
app.post('/user/image', FBAuth, uploadImage);   // Upload Image
app.post('/user', FBAuth, addUserDetails);      // Edit User Info
app.get('/user', FBAuth, getAuthenticatedUser);

// User Routes
app.post('/signup', signup);                    // Signup 
app.post('/login', login);                      // Login

exports.api = functions.https.onRequest(app);