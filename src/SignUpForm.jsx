import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./config/firebase-config.js";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";

export function SignUpForm() {
    const [username, setUsername] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

    const handleFileChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };

    const handleCloseMessage = () => {
        setError("");
        setSuccessMessage("");
    };

    

const handleSubmit = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    setError("Les mots de passe ne correspondent pas.");
    return;
  }

  setLoading(true);

  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set displayName in Firebase Authentication
    await updateProfile(user, { displayName: username });

    // Send email verification
    await sendEmailVerification(user);

    // Upload profile picture
    const fileRef = ref(storage, `profile_pictures/${user.uid}`);
    await uploadBytes(fileRef, profilePicture);
    const photoURL = await getDownloadURL(fileRef);

    // Save user data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      username,
      dob,
      gender,
      email,
      photoURL,
      role: "responsable",
    });

    setLoading(false);
    setSuccessMessage("Inscription réussie ! Un e-mail de confirmation a été envoyé.");
    setTimeout(() => navigate("/login"), 3000);
  } catch (error) {
    setError(error.message);
    setLoading(false);
  }
};

    

  return (
    <div
      className="container d-flex justify-content-center align-items-center min-vh-100"
      style={{ backgroundColor: "#f9f9f9" }}
    >
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center text-primary mb-3">Créer un compte</h2>
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={handleCloseMessage}></button>
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {successMessage}
            <button type="button" className="btn-close" onClick={handleCloseMessage}></button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="form-label">Nom d'utilisateur</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Date de naissance</label>
            <input
              type="date"
              className="form-control"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Sexe</label>
            <select
              className="form-select"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Choisir un sexe</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">Courriel</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Confirmer le mot de passe</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Photo de profil</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="mb-3 text-center">
            <div
              className="g-recaptcha"
              data-sitekey="6LfmUnUqAAAAADg6c0oaWT5Y3Crr4Jq10hR4i-Aa"
            ></div>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Chargement..." : "S'inscrire"}
          </button>
          <div className="text-center mt-3">
            <p>
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="text-primary">
                Connexion
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUpForm;
