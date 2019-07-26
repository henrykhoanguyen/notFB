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
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
} = require('./handlers/users');

// Scream Routes
app.get('/screams', getAllScreams);                 // Get All Screams
app.post('/scream', FBAuth, postOneScream);         // Post One Scream
app.get('/scream/:screamId', getScream);            // Get 1 Scream
app.delete('/scream/:screamId',
    FBAuth, deleteScream);                          // Delete Scream
app.get('/scream/:screamId/like',
    FBAuth, likeScream)                             // Like A scream
app.get('/scream/:screamId/unlike', 
    FBAuth, unlikeScream)                           // Unlike A Scream
app.post('/scream/:screamId/comment',
    FBAuth, commentOnScream);                       // Comment On A Scream

// User Routes
app.post('/signup', signup);                        // Signup 
app.post('/login', login);                          // Login
app.post('/user/image', FBAuth, uploadImage);       // Upload Image
app.post('/user', FBAuth, addUserDetails);          // Edit User Info
app.get('/user', FBAuth, getAuthenticatedUser);     // Get All Users Info
app.get('/user/:handle', getUserDetails);           // Get One User Info
app.post('/notifications',
    FBAuth, markNotificationsRead);                 // Mark Notification Read

exports.api = functions.https.onRequest(app);

exports.deleteNotificationOnUnlike = functions
.firestore
.document('likes/{id}')
.onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch(err => {
            console.error(err);
            return;
        })
});

exports.createNotificationOnLike = functions
.firestore
.document('likes/{id}')
.onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle != snapshot.data().userHandle){
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
        .catch(err => {
            console.error(err);
            return;
        });
});

exports.createNotificationOnComment = functions
.firestore
.document('comments/{id}')
.onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle != snapshot.data().userHandle){
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
        .catch(err => {
            console.error(err);
            return;
        });
});

exports.onUserImageChange = functions
    .firestore
    .document('/users/{user.Id')
    .onUpdate(change => {
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data().imageUrl){
            console.log('image has changed');
            const batch = db.batch();
            return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
                .then(data => {
                    data.forEach(doc => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, { userImage: change.after.data().imageUrl });
                    })
                    return batch.commit();
                });
        } else return true;
    });

exports.onScreamDelete = functions
    .firestore
    .document('/screams/{user.Id')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db.collection('comments').where('screamId', '==', screamId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes').where('screamId', '==', screamId);
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications').where('screamId', '==', screamId);
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit();
            })
            .catch(err => {
                console.error(err);
            });
    })