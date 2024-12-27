// import { useState } from "react";
// import { auth } from "./config/./firebase-config.js";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"; // Import updateProfile
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { useNavigate } from "react-router-dom";
//
// function Signup() {
//     const navigate = useNavigate();
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [username, setUsername] = useState("");
//     const [error, setError] = useState("");
//
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//             const user = userCredential.user;
//
//             // Use updateProfile from firebase/auth to set the display name
//             await updateProfile(user, { displayName: username });
//             try {
//                 await sendEmailVerification(user);
//                 console.log("Email de vérification envoyé.");
//             } catch (error) {
//                 console.error("Erreur lors de l'envoi de l'email de vérification :", error);
//             }
//
//             alert("Création de compte réussi!");
//             navigate('/produit');
//         } catch (error) {
//             setError(error.message);
//         }
//     };
//
//
//     return (
//         <div className="container mt-5">
//             <h2 className="text-center mb-4">Création de Compte</h2>
//             <form onSubmit={handleSubmit} className="w-50 mx-auto">
//                 {error && <p className="text-danger">{error}</p>}
//                 <div className="form-group mb-3">
//                     <label>{"Nom d'utilisateur"}</label>
//                     <input
//                         type="text"
//                         className="form-control"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div className="form-group mb-3">
//                     <label>Adresse Courriel</label>
//                     <input
//                         type="email"
//                         className="form-control"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div className="form-group mb-3">
//                     <label>Mot de passe</label>
//                     <input
//                         type="password"
//                         className="form-control"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <button type="submit" className="btn btn-primary w-100">
//                     Créer
//                 </button>
//             </form>
//         </div>
//     );
// }
//
// export default Signup;
