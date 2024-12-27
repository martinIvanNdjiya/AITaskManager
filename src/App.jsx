import { Navigate } from "react-router-dom"; // Import Navigate for redirection

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { createContext, useState, useEffect } from "react";

import LoginPage from "./LoginPage.jsx";
import SignUpForm from "./SignUpForm.jsx";
import { TasksResponsable } from "./TasksResponsable.jsx";
import { GestionTasksAdmin } from "./GestionTasksAdmin.jsx";
import { UserManagement } from "./UserManagement.jsx";
import AddTask from "./AddTask.jsx";
import { UpdTask } from "./UpdTask.jsx";
import { DetailsTask } from "./DetailTasks.jsx";
import { Change } from "./Change.jsx";
import PrivateRoute from "./PrivateRoute";
import PresentationPage from "./PresentationPage.jsx";
import TacheListe from "./TacheListe.jsx";
import Profil from "./Profil.jsx";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./config/firebase-config.js";
import { doc, getDoc } from "firebase/firestore";
import NavBar from "./NavBar"; // Import NavBar

// Contexte pour partager le token entre les composants
export const tokenContext = createContext();
const App = () => {
  const [token, setToken] = useState(""); // State for token
  const [userRole, setUserRole] = useState(""); // State for user role

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        user.getIdToken()
          .then((idToken) => {
            setToken(idToken);
            localStorage.setItem("token", idToken);
          })
          .catch((error) => {
            console.error("Erreur lors de la récupération du token :", error);
          });

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setToken("");
        localStorage.removeItem("token");
        setUserRole("");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return (
    <tokenContext.Provider value={{ token, setToken }}>
      <Router>
        <NavBar token={token} userRole={userRole} />

        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/tasksResponsable" replace /> : <PresentationPage />}
          />

          <Route path="/signIn" element={<SignUpForm />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/TacheListe" element={<TacheListe />} />

          {/* Private Routes */}
          <Route path="/addTask" element={<PrivateRoute element={<AddTask />} />} />
          {userRole !== "responsable" && (
            <Route path="/gestionTasksAdmin" element={<PrivateRoute element={<GestionTasksAdmin />} />} />
          )}
          <Route path="/tasksResponsable" element={<PrivateRoute element={<TasksResponsable />} />} />
          <Route path="/userManagement" element={<PrivateRoute element={<UserManagement />} />} />
          <Route path="/updTask/:id" element={<PrivateRoute element={<UpdTask />} />} />
          <Route path="/DetailTasks/:id" element={<PrivateRoute element={<DetailsTask />} />} />
          <Route path="/profile" element={<PrivateRoute element={<Profil />} />} />
          <Route path="/test_changement_statut" element={<PrivateRoute element={<Change />} />} />

          {/* Debug Route */}
          <Route path="/debug" element={
            <div>
              <h1>Token Debug</h1>
              <p>{token ? `Token : ${token}` : "Pas de token"}</p>
            </div>
          } />
        </Routes>
      </Router>
    </tokenContext.Provider>
  );
};

export default App;
