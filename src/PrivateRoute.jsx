import { Navigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { tokenContext } from "./App"; // Importer le contexte pour vérifier le jeton.
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase-config.js';

const PrivateRoute = ({ element }) => {
  const { token, setToken } = useContext(tokenContext); // Utilisation du contexte pour récupérer le token
  const [user, loading] = useAuthState(auth); // Récupérer l'utilisateur Firebase

  useEffect(() => {
    if (user) {
      // Lors de la connexion, on sauvegarde le jeton dans localStorage et dans l'état
      localStorage.setItem("authToken", user.accessToken);
      setToken(user.accessToken);
    } else {
      // Si l'utilisateur se déconnecte, on retire le jeton
      localStorage.removeItem("authToken");
      setToken(null);
    }
  }, [user, setToken]);

  if (loading) {
    return <div>Loading...</div>; // Si on attend la réponse de Firebase
  }

  if (!user) {
    return <Navigate to="/login" replace />; // Rediriger vers la page de login si l'utilisateur n'est pas connecté
  }

  // Si l'utilisateur est authentifié et que le token est présent dans le contexte
  return token ? element : <Navigate to="/login" />; // Si pas de token, rediriger vers login
};

export default PrivateRoute;
