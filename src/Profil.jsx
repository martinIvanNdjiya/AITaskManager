import React, { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { db, storage, auth } from "./config/firebase-config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Profil() {
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    email: "",
    profilePicture: "",
  });
  const [passwordForEmailChange, setPasswordForEmailChange] = useState("");
  const [passwordChange, setPasswordChange] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const PhotoURLInconnuePlaceholder =
    "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50";

  // Chargement des données utilisateur lors de l'authentification
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            name: userData.username || currentUser.displayName,
            bio: userData.bio || "",
            email: currentUser.email,
            profilePicture: userData.profilePicture || currentUser.photoURL || PhotoURLInconnuePlaceholder,
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Gestion du téléchargement de la photo de profil
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      const storageRef = ref(storage, `profile_pictures/${user.uid}/${Date.now()}_${file.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        await updateDoc(doc(db, "users", user.uid), { profilePicture: downloadURL });
        await updateProfile(user, { photoURL: downloadURL });
        setProfile((prev) => ({ ...prev, profilePicture: downloadURL }));
      } catch (error) {
        console.error("Erreur lors du téléchargement de la photo de profil :", error);
        alert("Échec du téléchargement de la photo de profil. Veuillez réessayer.");
      }
    }
  };

  // Gestion des changements des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Sauvegarde des modifications du profil
  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (profile.email !== user.email) {
        const credential = EmailAuthProvider.credential(user.email, passwordForEmailChange);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, profile.email);
      }

      await updateDoc(doc(db, "users", user.uid), {
        username: profile.name,
        bio: profile.bio,
        email: profile.email,
      });

      await updateProfile(user, {
        displayName: profile.name,
      });

      const tasksQuery = query(collection(db, "Taches"), where("responsableId", "==", user.uid));
      const tasksSnapshot = await getDocs(tasksQuery);
      const batchUpdates = tasksSnapshot.docs.map((taskDoc) =>
        updateDoc(taskDoc.ref, { responsable: profile.name })
      );

      await Promise.all(batchUpdates);

      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      alert("Échec de la mise à jour du profil. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Modification du mot de passe
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmNewPassword } = passwordChange;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      alert("Mot de passe mis à jour avec succès !");
      setPasswordChange({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe :", error);
      alert("Échec de la mise à jour du mot de passe. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <img
            src={profile.profilePicture}
            alt="Profil"
            className="profile-avatar"
          />
          <div
            className="avatar-hover-overlay"
            onClick={() => document.getElementById("file-upload").click()}
          >
            <i className="fas fa-camera"></i>
          </div>
        </div>
        <input
          type="file"
          id="file-upload"
          className="file-upload"
          onChange={handleFileChange}
        />
      </div>

      <div className="profile-details">
        <h2 className="profile-section-title">Informations personnelles</h2>
        <div className="input-group">
          <label htmlFor="name">Nom</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="input-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="profile-actions">
        <input
          type="password"
          placeholder="Entrez le mot de passe pour modifier l'email"
          value={passwordForEmailChange}
          onChange={(e) => setPasswordForEmailChange(e.target.value)}
          className="password-input"
        />
        <button
          className="btn-save"
          onClick={handleSaveProfile}
          disabled={loading}
        >
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
        <button
          className="btn-save"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          Modifier le mot de passe
        </button>
      </div>

      {isPasswordModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Modifier le mot de passe</h2>
            <div className="input-group">
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input
                type="password"
                id="currentPassword"
                value={passwordChange.currentPassword}
                onChange={(e) => setPasswordChange({ ...passwordChange, currentPassword: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                type="password"
                id="newPassword"
                value={passwordChange.newPassword}
                onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={passwordChange.confirmNewPassword}
                onChange={(e) =>
                  setPasswordChange({ ...passwordChange, confirmNewPassword: e.target.value })
                }
              />
            </div>
            <button
              className="btn-save"
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
            <button
              className="btn-cancel"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profil;
