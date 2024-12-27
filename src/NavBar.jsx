import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { tokenContext } from "./App";
import { signOut } from "firebase/auth";
import { auth } from "./config/firebase-config";

const NavBar = ({ userRole }) => {
  const { token, setToken } = useContext(tokenContext);

  const logout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      setToken(""); // Clear token from state
      localStorage.removeItem("token"); // Clear token from localStorage
      window.alert("Vous êtes déconnecté"); // Show logout alert
      window.location.href = "/login"; // Redirect to login page
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error.message); // Log the error
    }
  };

  return (
    <nav className="navbar is-info" role="navigation" aria-label="main navigation">

      <div className="navbar-menu">
        <div className="navbar-start">
          {/* Accueil only shows when not logged in */}
          {!token && (
            <Link to="/" className="navbar-item">
              Accueil
            </Link>
          )}

          {/* Conditional links based on user role */}
          {token && userRole !== "responsable" && (
            <Link to="/gestionTasksAdmin" className="navbar-item">
              Gestion des Tâches
            </Link>
          )}
          {token && userRole === "responsable" && (
            <Link to="/tasksResponsable" className="navbar-item">
              Tâches Responsable
            </Link>
          )}
        </div>

        <div className="navbar-end">
          {token ? (
            <>
              <Link to="/profile" className="navbar-item">
                Profil
              </Link>
              <Link onClick={logout} className="navbar-item button is-light">
                Déconnexion
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-item">
                Connexion
              </Link>
              <Link to="/signIn" className="navbar-item">
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
