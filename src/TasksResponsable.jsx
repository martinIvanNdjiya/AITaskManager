import { useEffect, useState } from "react";
import { auth, db } from "./config/firebase-config.js";
import { collection, doc, getDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./GestionTaskAdmin.css"; // Same CSS as GestionTasksAdmin

export function TasksResponsable() {
    const [tasks, setTasks] = useState([]);
    const [filters, setFilters] = useState({ priorite: "", statut: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    const [taillePage, setTaillePage] = useState(5); // Default to 5
    const [pageCourante, setPageCourrante] = useState(1);
    const navigate = useNavigate();

    const handleDetails = (id) => {
        navigate(`/DetailTasks/${id}`);
    };

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
                (filters.statut ? task.status === filters.statut : true);

            const matchesSearch =
                task.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesFilters && matchesSearch;
        });
    };

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                if (!userId) return;

                const userRef = doc(db, "users", userId);
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    console.error("Utilisateur introuvable.");
                    return;
                }

                const user = userDoc.data();
                const username = user.username;

                const tasksCollection = query(
                    collection(db, "Taches"),
                    where("responsable", "==", username),
                    orderBy("dateSoumission", "desc")
                );

                const unsubscribe = onSnapshot(tasksCollection, (snapshot) => {
                    const tasksList = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setTasks(tasksList);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error("Erreur lors du chargement des tâches :", err);
            }
        };

        fetchTasks();
    }, [userId]);

    useEffect(() => {
        setPageCourrante(1); // Reset to page 1 when the tasks per page size changes
    }, [taillePage]);

    return (
        <div className="container">
            <div className="section">
                {/* Filters and Search */}
                <div className="task-controls">
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
                    </div>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="🔍 Rechercher par titre ou description..."
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
                            </tr>
                        </thead>
                        <tbody>
                            {paginer().length > 0 ? (
                                paginer().map((t) => (
                                    <tr
                                        key={t.id}
                                        className={t.status === "Complété" ? "task-completed" : ""}
                                    >
                                        <td className={t.status === "Complété" ? "grayed-out" : ""}>
                                            {t.status === "Complété" ? (
                                                <span>{t.titre}</span>
                                            ) : (
                                                <a onClick={() => handleDetails(t.id)}>{t.titre}</a>
                                            )}
                                        </td>
                                        <td
                                            className={`priorite-${t.priorite} ${t.status === "Complété" ? "grayed-out" : ""
                                                }`}
                                        >
                                            {t.priorite}
                                        </td>
                                        <td
                                            className={`status-${t.status.replace(
                                                /\s+/g,
                                                "-"
                                            )} ${t.status === "Complété" ? "grayed-out" : ""}`}
                                        >
                                            {t.status}
                                        </td>
                                        <td
                                            className={t.status === "Complété" ? "grayed-out" : ""}
                                        >
                                            {t.dateSoumission}
                                        </td>
                                        <td
                                            className={t.status === "Complété" ? "grayed-out" : ""}
                                        >
                                            {t.utilisateurSoumettant}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="table-empty-state">
                                        Aucune données
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
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
                                className={`pagination-button ${page === pageCourante ? "active" : ""}`}
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
        </div>
    );
}
