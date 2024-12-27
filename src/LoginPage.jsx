import { useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import { auth, googleProvider, githubProvider, db } from "./config/firebase-config.js";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { tokenContext } from "./App";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setToken } = useContext(tokenContext);

  useEffect(() => {
    return () => {};
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();
      setToken(token);
      await handleUserData(user);
    } catch (error) {
      console.error("Erreur de connexion Google:", error);
      alert("Erreur lors de la connexion Google. Veuillez réessayer.");
    }
  };

  const handleGithubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const token = await user.getIdToken();
      setToken(token);
      await handleUserData(user);
    } catch (error) {
      console.error("Erreur de connexion Github:", error);
      alert("Erreur lors de la connexion Github. Veuillez réessayer.");
    }
  };

  const handleEmailPasswordLogin = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("Veuillez vérifier votre email avant de vous connecter.");
        return;
      }

      const token = await user.getIdToken();
      setToken(token);
      await handleUserData(user);
    } catch (error) {
      console.error("Erreur de connexion par email et mot de passe:", error);
      alert("Erreur lors de la connexion. Veuillez réessayer.");
    }
  };

  const handleUserData = async (user) => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email.split("@")[0], // Fallback to email prefix
        photoURL: user.photoURL || "",
        role: "responsable",
      };
      await setDoc(doc(db, "users", user.uid), userData);
    }
  
    const userDocAfterLogin = await getDoc(doc(db, "users", user.uid));
    if (userDocAfterLogin.exists()) {
      const role = userDocAfterLogin.data().role;
      if (role === "responsable") {
        navigate("/tasksResponsable");
      } else if (role === "admin") {
        navigate("/gestionTasksAdmin");
      } else {
        alert("Rôle de l’utilisateur inconnu.");
      }
    } else {
      alert("Utilisateur non trouvé après la connexion.");
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center min-vh-100"
      style={{ backgroundColor: "#f9f9f9" }}
    >
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center text-primary mb-3">Connexion</h2>
        <form onSubmit={handleEmailPasswordLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Adresse courriel
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              placeholder="Entrez votre email"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-3">
            Connexion
          </button>
        </form>

        <hr className="my-3" />
        <div className="text-center">
          <button
            className="btn btn-outline-danger w-100 mb-2"
            onClick={handleGoogleLogin}
          >
            <FontAwesomeIcon icon={faGoogle} className="me-2" />
            Connexion avec Google
          </button>
          <button
            className="btn btn-outline-dark w-100"
            onClick={handleGithubLogin}
          >
            <FontAwesomeIcon icon={faGithub} className="me-2" />
            Connexion avec Github
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-muted">
            Pas encore de compte ?{" "}
            <Link to="/signIn" className="text-primary">
              Inscrivez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
