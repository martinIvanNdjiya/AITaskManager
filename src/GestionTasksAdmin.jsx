import { useContext, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "./config/firebase-config.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import AddTask from "./AddTask";
import "./GestionTaskAdmin.css";
import { UpdTask } from "./UpdTask";

import edit from "./assets/images/edit.png";
import trash from "./assets/images/trash.png";


export function GestionTasksAdmin() {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({ priorite: "", statut: "", responsable: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [taillePage, setTaillePage] = useState(5); // Default value set to 5
    const [pageCourante, setPageCourrante] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    useEffect(() => {
        const tasksCollection = collection(db, "Taches");
        const q = query(tasksCollection, orderBy("dateSoumission", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTasks(tasksList);
        });

        return () => unsubscribe();
    }, []);

    const nbPages = () => Math.ceil(filteredTasks().length / taillePage);

    const paginer = () => {
        const debut = (pageCourante - 1) * taillePage;
        const fin = debut + taillePage;
        return filteredTasks().slice(debut, fin);
    };

    const filteredTasks = () => {
        return tasks.filter((task) => {
            const matchesFilters =
                (filters.priorite ? task.priorite === filters.priorite : true) &&
                (filters.statut ? task.status === filters.statut : true) &&
                (filters.responsable ? task.responsable === filters.responsable : true);
            const matchesSearch =
                task.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesFilters && matchesSearch;
        });
    };

    const getUniqueResponsables = () => {
        const uniqueResponsables = new Set(filteredTasks().map((task) => task.responsable));
        return Array.from(uniqueResponsables);
    };

    const handleDelete = async (taskId) => {
        try {
            await deleteDoc(doc(db, "Taches", taskId));
            setTasks(tasks.filter((task) => task.id !== taskId));
            alert("Tâche supprimée avec succès!");
        } catch (err) {
            console.error("Échec de la suppression de la tâche.", err);
        }
    };

    const handleDetails = (id) => {
        navigate(`/DetailTasks/${id}`);
    };

    const handleEdit = (id) => {
        setSelectedTaskId(id);
        setIsEditModalOpen(true);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const data = tasks.map((task) => [
            task.id,
            task.titre,
            task.priorite,
            task.description || "N/A",
        ]);
        doc.autoTable({
            head: [["ID", "Titre", "Priorité", "Détails"]],
            body: data,
        });
        doc.save(`Taches_${Date.now()}.pdf`);
    };

    const exportToXLSX = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            tasks.map((task) => ({
                ID: task.id,
                Titre: task.titre,
                Priorité: task.priorite,
                Description: task.description || "N/A",
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Taches");
        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buffer]), `Taches_${Date.now()}.xlsx`);
    };

    useEffect(() => {
        setPageCourrante(1);
    }, [taillePage]);

    return (
        <div className="container">
            <div className="section">
                <div className="task-controls">
                    {/* Filters */}
                    <div className="filters-container">
                        <div className="filter-item">
                            <label>Priorité</label>
                            <select
                                value={filters.priorite}
                                onChange={(e) => setFilters({ ...filters, priorite: e.target.value })}
                            >
                                <option value="">Toutes</option>
                                <option value="Élevée">Élevée</option>
                                <option value="Moyenne">Moyenne</option>
                                <option value="Faible">Faible</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Statut</label>
                            <select
                                value={filters.statut}
                                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                            >
                                <option value="">Tous</option>
                                <option value="En cours">En cours</option>
                                <option value="Complété">Complété</option>
                                <option value="Différé">Différé</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Responsable</label>
                            <select
                                value={filters.responsable}
                                onChange={(e) => setFilters({ ...filters, responsable: e.target.value })}
                            >
                                <option value="">Tous</option>
                                {getUniqueResponsables().map((responsable, index) => (
                                    <option key={index} value={responsable}>
                                        {responsable}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Add Task Button */}
                    <button className="btn-add-task" onClick={() => setIsModalOpen(true)}>
                        + Add Task
                    </button>

                    {/* Export Buttons */}
                    <div className="export-buttons">
                        <button className="btn-export" onClick={exportToPDF}>
                            Export PDF
                        </button>
                        <button className="btn-export" onClick={exportToXLSX}>
                            Export Excel
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="🔍 Rechercher des tâches..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Barre de recherche"
                            className="search-input"
                        />
                    </div>
                </div>

                {/* Task Table */}
                <div className="task-table-container">
                    <table className="task-table">
                        <thead>
                            <tr>
                                <th>Titre</th>
                                <th>Priorité</th>
                                <th>Statut</th>
                                <th>Date de soumission</th>
                                <th>Soumis par</th>
                                <th>Assigné à</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    {paginer().length > 0 ? (
        paginer().map((t) => (
            <tr
                key={t.id}
                className={t.status === "Complété" ? "task-completed" : ""}
            >
                <td>
                    {t.status === "Complété" ? (
                        <span>{t.titre}</span>
                    ) : (
                        <a onClick={() => handleDetails(t.id)}>{t.titre}</a>
                    )}
                </td>
                <td className={`priorite-${t.priorite}`}>{t.priorite}</td>
                <td className={`status-${t.status.replace(/\s+/g, "-")}`}>
                    {t.status}
                </td>
                <td>{t.dateSoumission}</td>
                <td>{t.utilisateurSoumettant}</td>
                <td>{t.responsable}</td>
                <td className="utilite">
                    <>
                        <button
                            onClick={() => handleEdit(t.id)}
                            className="btn-edit"
                        >
                            <img src={edit} alt="Edit Icon" />
                        </button>
                        <button
                            onClick={() => handleDelete(t.id)}
                            className="btn-delete"
                        >
                            <img src={trash} alt="Trash Icon" />
                        </button>
                    </>
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan="7" className="table-empty-state">
                Aucune données
            </td>
        </tr>
    )}
</tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-container">
                    {/* Tasks Per Page Selector */}
                    <div className="tasks-per-page">
                        <select
                            value={taillePage}
                            onChange={(e) => setTaillePage(Number(e.target.value))}
                            className="tasks-per-page-select"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                        </select>
                    </div>

                    {/* Pagination Controls */}
                    <div className="pagination">
                        <button
                            disabled={pageCourante === 1}
                            onClick={() => setPageCourrante(pageCourante - 1)}
                            className="pagination-button"
                        >
                            &lt;
                        </button>
                        {pageCourante > 3 && (
                            <>
                                <button
                                    className="pagination-button"
                                    onClick={() => setPageCourrante(1)}
                                >
                                    1
                                </button>
                                {pageCourante > 4 && <span className="pagination-dots">...</span>}
                            </>
                        )}
                        {Array.from({ length: 3 }, (_, i) => pageCourante - 1 + i)
                            .filter((page) => page > 0 && page <= nbPages())
                            .map((page) => (
                                <button
                                    key={page}
                                    className={`pagination-button ${page === pageCourante ? "active" : ""
                                        }`}
                                    onClick={() => setPageCourrante(page)}
                                >
                                    {page}
                                </button>
                            ))}
                        {pageCourante < nbPages() - 2 && (
                            <>
                                {pageCourante < nbPages() - 3 && (
                                    <span className="pagination-dots">...</span>
                                )}
                                <button
                                    className="pagination-button"
                                    onClick={() => setPageCourrante(nbPages())}
                                >
                                    {nbPages()}
                                </button>
                            </>
                        )}
                        <button
                            disabled={pageCourante === nbPages()}
                            onClick={() => setPageCourrante(pageCourante + 1)}
                            className="pagination-button"
                        >
                            &gt;
                        </button>
                    </div>
                </div>

                {/* Modals */}
                {isModalOpen && (
                    <div className="modal">
                        <div className="modal-content">
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                ×
                            </button>
                            <AddTask closeModal={() => setIsModalOpen(false)} />
                        </div>
                    </div>
                )}

                {isEditModalOpen && selectedTaskId && (
                    <div className="modal">
                        <div className="modal-content">
                            <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                                ×
                            </button>
                            <UpdTask taskId={selectedTaskId} closeModal={() => setIsEditModalOpen(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
