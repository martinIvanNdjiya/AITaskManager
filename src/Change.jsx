import { useEffect, useRef } from "react";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "./config/firebase-config";

export function Change() {
    const previousPriorities = useRef({}); // To store priorite values for comparison

    useEffect(() => {
        const fetchTasks = async () => {
            const user = auth.currentUser;

            if (!user) {
                console.log("No user is signed in.");
                return;
            }

            const usersDocRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(usersDocRef);

            if (!userSnapshot.exists()) {
                console.error("User document not found.");
                return;
            }

            const username = userSnapshot.data().username;

            const tachesCollectionRef = collection(db, "Taches");
            const q = query(tachesCollectionRef, where("responsable", "==", username));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const docId = change.doc.id;
                    const docData = change.doc.data();
                    const newPriorite = docData.priorite;

                    // Handle only modifications
                    if (change.type === "modified") {
                        const oldPriorite = previousPriorities.current[docId];

                        // Check if the "priorite" field has changed
                        if (oldPriorite !== newPriorite) {
                            console.log(`Document ${docId} priorite changed.`);
                            console.log(`Old priorite: ${oldPriorite}, New priorite: ${newPriorite}`);
                        }
                    }

                    // Update the stored priorite value
                    previousPriorities.current[docId] = docData.priorite;
                });
            });

            return () => unsubscribe();
        };

        fetchTasks();
    }, []);

    return <div>Listening for task updates...</div>;
};



// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const sgMail = require("@sendgrid/mail");

// admin.initializeApp();
// const db = admin.firestore();

// // Set your SendGrid API Key
// sgMail.setApiKey("YOUR_SENDGRID_API_KEY");

// exports.sendEmailOnPrioriteChange = functions.firestore
//   .document("Taches/{taskId}")
//   .onUpdate(async (change, context) => {
//     const before = change.before.data();
//     const after = change.after.data();

//     // Check if the "priorite" field has changed
//     if (before.priorite === after.priorite) {
//       return null;
//     }

//     // Get the responsible user's email
//     const username = after.responsable;
//     const usersQuery = await db.collection("users").where("username", "==", username).get();

//     if (usersQuery.empty) {
//       console.log("No user found with username:", username);
//       return null;
//     }

//     const userDoc = usersQuery.docs[0];
//     const email = userDoc.data().email;

//     // Send an email notification
//     const msg = {
//       to: email,
//       from: "your-email@example.com", // Verified sender email
//       subject: "Priorité de tâche modifiée",
//       text: `Bonjour ${username}, 
      
// La priorité de votre tâche "${after.nom}" a changé à: ${after.priorite}.`,
//       html: `<p>Bonjour ${username},</p>
//              <p>La priorité de votre tâche "<strong>${after.nom}</strong>" a changé à: <strong>${after.priorite}</strong>.</p>`,
//     };

//     try {
//       await sgMail.send(msg);
//       console.log("Email sent to:", email);
//     } catch (error) {
//       console.error("Error sending email:", error);
//     }

//     return null;
//   });
