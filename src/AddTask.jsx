import { useState, useEffect } from "react";
import { db, auth } from "./config/firebase-config";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import "./AddTask.css";

const priorities = ["Faible", "Moyenne", "Élevée"];
const status = ["En cours", "Complété", "Différé"];

const AddTask = ({ closeModal }) => {
  const [users, setUsers] = useState([]);
  const [newTache, setNewTache] = useState({
    titre: "",
    responsable: auth.currentUser?.uid,
    priorite: "Faible",
    description: "",
    status: "En cours",
    suiviCommentaires: [],
    piecesJointes: [],
  });
  const [errors, setErrors] = useState({});
  const [dateSoumission] = useState(new Date().toLocaleString());
  const [utilisateurSoumettant] = useState(auth.currentUser?.email || "Anonymous");
  const tachesCollection = collection(db, "Taches");

  // Fetch users for the dropdown
  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs :", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFileUpload = (files) => {
    setNewTache((prevTache) => ({
      ...prevTache,
      piecesJointes: files,
    }));
  };

  const validateForm = () => {
    const validationErrors = {};
    if (!newTache.titre.trim()) validationErrors.titre = "Le titre est requis.";
    if (!newTache.description.trim()) validationErrors.description = "La description est requise.";
    if (!newTache.responsable) validationErrors.responsable = "Le responsable est requis.";
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleAddTache = async () => {
    if (!validateForm()) {
      console.error("Problème dans le formulaire");
      return;
    }

    const responsableId = users.find((user) => user.id === newTache.responsable)?.id;
    const responsableUsername = users.find((user) => user.id === newTache.responsable)?.username;

    if (!responsableId || !responsableUsername) {
      console.error("Responsable non trouvé.");
      setErrors({ responsable: "Responsable invalide." });
      return;
    }

    const tacheData = {
      ...newTache,
      responsableId,
      responsable: responsableUsername,
      dateSoumission,
      utilisateurSoumettant,
      piecesJointes: Array.from(newTache.piecesJointes).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    try {
      const docRef = await addDoc(tachesCollection, tacheData);
      console.log("Tâche ajoutée avec succès, ID:", docRef.id);

      setNewTache({
        titre: "",
        responsable: "",
        priorite: "Faible",
        description: "",
        status: "En cours",
        suiviCommentaires: [],
        piecesJointes: [],
      });
      setErrors({});
      alert("Tâche Ajouter avec succès !");
      closeModal();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche :", error);
    }
  };

  return (
    <div className="container">
      <h2>Nouvelle Tâche</h2>
      <form className="box">
        <div className="form-row">
          <div className="form-group">
            <label>Titre :</label>
            <input
              type="text"
              value={newTache.titre}
              onChange={(e) => setNewTache({ ...newTache, titre: e.target.value })}
            />
            {errors.titre && <p className="help is-danger">{errors.titre}</p>}
          </div>

          <div className="form-group">
            <label>Status :</label>
            <select
              value={newTache.status}
              onChange={(e) => setNewTache({ ...newTache, status: e.target.value })}
            >
              {status.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Responsable :</label>
            <select
              value={newTache.responsable}
              onChange={(e) => setNewTache({ ...newTache, responsable: e.target.value })}
            >
              <option value={auth.currentUser?.uid}>
                {auth.currentUser?.displayName || "Moi (Admin)"} (Admin)
              </option>
              {users
                .filter(user => user.id !== auth.currentUser?.uid)
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
            </select>
            {errors.responsable && <p className="help is-danger">{errors.responsable}</p>}
          </div>
        </div>

        <div className="form-group">
          <label>Description :</label>
          <textarea
            value={newTache.description}
            onChange={(e) => setNewTache({ ...newTache, description: e.target.value })}
          ></textarea>
          {errors.description && <p className="help is-danger">{errors.description}</p>}
        </div>

        <div className="form-group">
          <label>Ajouter des pièces jointes :</label>
          <input type="file" multiple onChange={(e) => handleFileUpload(e.target.files)} />
        </div>

        <div className="form-group">
          <label>Priorité :</label>
          <select
            value={newTache.priorite}
            onChange={(e) => setNewTache({ ...newTache, priorite: e.target.value })}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <button
          className="button is-primary"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            handleAddTache();
          }}
        >
          Sauvegarder
        </button>
        <button className="button is-secondary" onClick={closeModal}>
          Annuler
        </button>
      </form>
    </div>
  );
};

export default AddTask;
