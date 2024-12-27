import React, { useState, useEffect } from "react";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver-es";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { db, auth } from "./config/firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import "./TacheListe.css";

const priorities = ["Faible", "Moyenne", "Élevée"];
const rowsPerPage = 10;

const Taches = () => {
  const [taches, setTaches] = useState([]);
  const [newTache, setNewTache] = useState({
    titre: "",
    responsable: "",
    assignation: "",
    priorite: "Faible",
    details: "",
    piecesJointes: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const tachesCollection = collection(db, "Taches");


  const handleFileUpload = (files) => {
    setNewTache((prevTache) => ({
      ...prevTache,
      piecesJointes: files,
    }));
  };

  // Fetch les taches de firebase
  const fetchTaches = async () => {
    setLoading(true);
    try {
      const tachesSnapshot = await getDocs(tachesCollection);
      const fetchedTaches = tachesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTaches(fetchedTaches);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaches();
  }, []);

  const handleAddTache = async () => {
    if (!newTache.titre || !newTache.details) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const tacheData = {
      ...newTache,
      createdBy: auth.currentUser?.email || "Anonymous",
      createdAt: serverTimestamp(),
      piecesJointes: Array.from(newTache.piecesJointes).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    try {
      await addDoc(tachesCollection, tacheData);
      fetchTaches();
      setNewTache({
        titre: "",
        responsable: "",
        assignation: "",
        priorite: "Faible",
        details: "",
        piecesJointes: [],
      });
      setPopupVisible(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleDeleteTache = async (tacheId) => {
    try {
      await deleteDoc(doc(db, "Taches", tacheId));
      fetchTaches();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredTaches = taches.filter((tache) =>
    tache.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedTaches = filteredTaches.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Exporte en PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const data = taches.map((tache) => [
      tache.id,
      tache.titre,
      tache.priorite,
      tache.details,
    ]);
    doc.autoTable({
      head: [["ID", "Titre", "Priorité", "Détails"]],
      body: data,
    });
    doc.save(`Taches_${Date.now()}.pdf`);
  };

  // Exporte en XLSX
  const exportToXLSX = () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Taches");
    worksheet.addRow(["ID", "Titre", "Priorité", "Détails"]);
    taches.forEach((tache) =>
      worksheet.addRow([tache.id, tache.titre, tache.priorite, tache.details])
    );
    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(new Blob([buffer]), `Taches_${Date.now()}.xlsx`);
    });
  };

  return (
    <div className="tache-manager">
      {/* Toolbar */}
      <div className="toolbar">
        <h1>Gestion des Tâches</h1>
        <div className="toolbar-actions">
          <input
            type="text"
            placeholder="Rechercher une tâche"
            value={searchQuery}
            onChange={handleSearch}
          />
          <button onClick={() => setPopupVisible(true)}>Ajouter</button>
          <button onClick={exportToPDF}>Exporter en PDF</button>
          <button onClick={exportToXLSX}>Exporter en XLSX</button>
        </div>
      </div>

      {/* Popup Form */}
      {popupVisible && (
        <div className="popup">
          <div className="popup-content">
            <h2>Nouvelle Tâche</h2>
            <form>
              <div className="form-row">
                <div className="form-group">
                  <label>Sujet</label>
                  <input
                    type="text"
                    value={newTache.titre}
                    onChange={(e) =>
                      setNewTache({ ...newTache, titre: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Responsable</label>
                  <input
                    type="text"
                    value={newTache.responsable}
                    onChange={(e) =>
                      setNewTache({ ...newTache, responsable: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assigné à</label>
                  <input
                    type="text"
                    value={newTache.assignation}
                    onChange={(e) =>
                      setNewTache({ ...newTache, assignation: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Priorité</label>
                  <select
                    value={newTache.priorite}
                    onChange={(e) =>
                      setNewTache({ ...newTache, priorite: e.target.value })
                    }
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Détails</label>
                <textarea
                  value={newTache.details}
                  onChange={(e) =>
                    setNewTache({ ...newTache, details: e.target.value })
                  }
                ></textarea>
              </div>
              <div className="form-group">
                <label>Ajouter des pièces jointes</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                {newTache.piecesJointes?.length > 0 && (
                  <ul className="file-list">
                    {Array.from(newTache.piecesJointes).map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="buttons">
                <button type="button" onClick={handleAddTache}>
                  Sauvegarder
                </button>
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setPopupVisible(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Taches Table */}
      <div className="tache-list">
        <table>
          <thead>
            <tr>
              <th>Sélectionner</th>
              <th>Titre</th>
              <th>Priorité</th>
              <th>Détails</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTaches.map((tache) => (
              <tr key={tache.id}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>{tache.titre}</td>
                <td>{tache.priorite}</td>
                <td>{tache.details}</td>
                <td>
                  <button onClick={() => handleDeleteTache(tache.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from(
          { length: Math.ceil(filteredTaches.length / rowsPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Taches;