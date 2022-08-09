const functions = require("firebase-functions");

const admin = require("firebase-admin");

const serviceAccount = require(
    "./simplesignal-ba161-firebase-adminsdk-wl2gq-2971c0c1f8.json",
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.addMessage = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection("messages").add(
      {original: original},
  );
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

exports.registerToken = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Get the group ID
  const group = req.query.group;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore()
      .collection("groups").doc(group).set(
          {token: original},
      );
  // Send back a message that we've successfully written the message
  res.json({result: `Token with ID: ${writeResult.id} added.`});
});

// Listens for new messages added to /messages/:documentId/original
// and creates an uppercase version of the message to
// /messages/:documentId/uppercase
exports.makeUppercase = functions.firestore.document(
    "/messages/{documentId}",
).onCreate((snap, context) => {
  // Grab the current value of what was written to Firestore.
  const original = snap.data().original;

  // Access the parameter `{documentId}` with `context.params`
  functions.logger.log("Uppercasing", context.params.documentId, original);
  const uppercase = original.toUpperCase();
  // You must return a Promise when performing asynchronous tasks inside
  // a Functions such as writing to Firestore.
  // Setting an 'uppercase' field in Firestore document returns a Promise.
  return snap.ref.set({uppercase}, {merge: true});
});

exports.broadcastAll = functions.firestore.document("/messages/{documentId}")
    .onCreate((snap, context) => {
      const original = snap.data().original;
      const payload = {
        notification: {
          title: "New Message!",
          body: original,
        },
      };
      const tokenRef = db.collection("tokens");
      tokenRef.get()
          .then((snapshot) => {
            snapshot.forEach((doc) => {
              console.log(doc.id, "=>", doc.data());
              admin.messaging().sendToDevice(doc.data().token, payload);
            });
          })
          .catch((err) => {
            console.log("Error getting documents", err);
          });
      // admin.database().ref('/tokens/test').once('value').then(result=>{
      //     console.log('result: ');
      //     console.log(result.val());
      // });
      // console.log
    });

//     export const sendPushNotification = async (token, title, body,) => {
//         console.log("token==>", token);

//         const FIREBASE_API_KEY = "AIzaSyBX8HBmxS9wdPaAB-qK-87hq4E0ZSON0dw"
//         const fcmToken = await messaging().getToken();

//         const message = {
//           registration_ids: [token],
//           notification: {
//             title: title,
//             body: body,
//             vibrate: 1,
//             sound: 1,
//             show_in_foreground: true,
//             priority: "high",
//             content_available: true
//           },
//         };
//         console.log("message==>", message);

//         let headers = new Headers({
//           "Content-Type": "application/json",
//           'Authorization': 'Bearer ' + fcmToken
//         });

//         let response = await fetch("https://fcm.googleapis.com/v1/projects/project-249012544062/messages:send", {
//           method: "POST",
//           headers,
//           body: JSON.stringify(message)
//         });
//           console.log("=><*", response);
//           response = await response.json();
//           console.log(response);
//         };
