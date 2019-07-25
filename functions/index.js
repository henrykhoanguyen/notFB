const functions = require('firebase-functions');
const { db } = require('./util/admin');

// const express = require('express);
// const app = express();
const app = require('express')();

// Authenticator Middleware
const FBAuth = require('./util/fbAuth');

const { 
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require('./handlers/screams');

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
app.get('/scream/:screamId', getScream);        // Get 1 Scream
app.delete('/scream/:screamId',
    FBAuth, deleteScream);                      // Delete Scream
app.get('/scream/:screamId/like',
    FBAuth, likeScream)                         // Like A scream
app.get('/scream/:screamId/unlike', 
    FBAuth, unlikeScream)                       // Unlike A Scream
app.post('/scream/:screamId/comment',
    FBAuth, commentOnScream);                   // Comment On A Scream

// User Routes
app.post('/signup', signup);                    // Signup 
app.post('/login', login);                      // Login
app.post('/user/image', FBAuth, uploadImage);   // Upload Image
app.post('/user', FBAuth, addUserDetails);      // Edit User Info
app.get('/user', FBAuth, getAuthenticatedUser); // Get Users Info

exports.api = functions.https.onRequest(app);

exports.deleteNotificationOnUnlike = functions
.firestore
.document('likes/{id}')
.onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .then(() => {
            return;
        })
        .catch(err => {
            console.error(err);
            return;
        })
});

exports.createNotificationOnLike = functions
.firestore
.document('likes/{id}')
.onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if(doc.exists){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: doc.id
                });
            }
        })
        .then(() => {
            return;
        })
        .catch(err => {
            console.error(err);
            return;
        });
});

exports.createNotificationOnComment = functions
.firestore
.document('comments/{id}')
.onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if(doc.exists){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: doc.id
                });
            }
        })
        .then(() => {
            return;
        })
        .catch(err => {
            console.error(err);
            return;
        });
});