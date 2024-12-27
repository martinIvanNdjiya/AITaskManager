import { db, auth } from "./config/firebase-config.js";
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";

const priorities = ["Faible", "Moyenne", "Élevée"];
const statuses = ["En cours", "Complété", "Différé"];

emailjs.init("vu_AyYKDFLas7GNVb");

export function UpdTask({ taskId, closeModal }) {
    const [task, setTask] = useState({
        titre: "",
        responsable: "",
        responsableId: "",
        priorite: "Faible",
        description: "",
        status: "En cours",
        piecesJointes: [],
    });
    const [users, setUsers] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const navigate = useNavigate();
    const [originalTask, setOriginalTask] = useState(null);

    // Récupérer les détails de la tâche
    useEffect(() => {
        const fetchTask = async () => {
            if (!taskId) {
                console.error("L'ID de la tâche est manquant.");
                return;
            }
            try {
                const taskDoc = await getDoc(doc(db, "Taches", taskId));
                if (taskDoc.exists()) {
                    const taskData = taskDoc.data();
                    setTask({
                        ...taskData,
                        responsableId: taskData.responsableId || "",
                        responsable: taskData.responsable || "",
                    });
                    setOriginalTask({ ...taskData });
                } else {
                    console.error("La tâche avec l'ID spécifié n'existe pas.");
                }
            } catch (error) {
                console.error("Erreur lors du chargement de la tâche :", error);
            }
        };

        fetchTask();
    }, [taskId]);

    // Récupérer les utilisateurs pour le menu déroulant
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, "users"));
                setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Erreur lors du chargement des utilisateurs :", error);
            }
        };

        fetchUsers();
    }, []);

    // Récupérer le rôle de l'utilisateur actuel
    useEffect(() => {
        const fetchCurrentUserRole = async () => {
            try {
                const currentUserId = auth.currentUser?.uid;
                if (!currentUserId) return;

                const userDoc = await getDoc(doc(db, "users", currentUserId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUserRole(userData.role);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération du rôle de l'utilisateur :", error);
            }
        };

        fetchCurrentUserRole();
    }, []);

    // Gérer les changements dans les champs du formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTask((prev) => ({ ...prev, [name]: value }));
    };

    const handleResponsableChange = (e) => {
        const selectedId = e.target.value;
        const selectedUser = users.find((user) => user.id === selectedId);
        setTask((prev) => ({
            ...prev,
            responsable: selectedUser ? selectedUser.username : "",
            responsableId: selectedId,
        }));
    };

    // Suppression des documents associés
    const deleteAssociatedDocuments = async (taskId) => {
        try {
            const taskRef = doc(db, "Taches", taskId);

            // Récupérer le document
            const taskDoc = await getDoc(taskRef);

            if (!taskDoc.exists()) {
                console.error(`La tâche avec l'ID ${taskId} n'existe pas.`);
                return;
            }

            const taskData = taskDoc.data();

            let updates = {};

            // Vérifiez et supprimez les éléments du tableau piecesJointes
            if (Array.isArray(taskData.piecesJointes) && taskData.piecesJointes.length > 0) {
                updates.piecesJointes = []; // Supprimer tous les éléments du tableau
                console.log("Suppression des pièces jointes associées.");
            } else {
                console.log("Aucune pièce jointe trouvée.");
            }

            // Vérifiez et supprimez les éléments du tableau suiviCommentaires
            if (Array.isArray(taskData.suiviCommentaires) && taskData.suiviCommentaires.length > 0) {
                updates.suiviCommentaires = []; // Supprimer tous les éléments du tableau
                console.log("Suppression des suivis commentaires associés.");
            } else {
                console.log("Aucun suivi commentaire trouvé.");
            }

            // Appliquer les mises à jour si des suppressions ont été effectuées
            if (Object.keys(updates).length > 0) {
                await updateDoc(taskRef, updates);
                console.log("Champs associés supprimés avec succès.");
            } else {
                console.log("Aucun champ à supprimer.");
            }
        } catch (error) {
            console.error("Erreur lors de la suppression des documents associés :", error);
        }
    };



    // Mettre à jour la tâche
    const handleUpdateTask = async () => {
        try {
            if (taskId) {
                const updateData = {
                    titre: task.titre,
                    priorite: task.priorite,
                    description: task.description,
                    status: task.status,
                    responsable: task.responsable,
                    responsableId: task.responsableId,
                };

                if (originalTask) {
                    // Vérification du changement de statut
                    if (originalTask.status !== task.status) {
                        await sendStatusChangeEmail(task);

                        // Suppression des documents si le statut devient "Complété"
                        if (originalTask && originalTask.status !== task.status) {
                            if (task.status === "Complété") {
                                await deleteAssociatedDocuments(taskId);
                            }
                            await sendStatusChangeEmail(task);
                        }
                    }

                    // Vérification du changement de responsable
                    if (originalTask.responsableId !== task.responsableId) {
                        await sendReassignmentEmail(task);
                    }
                }

                await updateDoc(doc(db, "Taches", taskId), updateData);

                alert("Tâche modifiée avec succès !");
                closeModal();
                navigate("/gestionTasksAdmin");
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la tâche :", error);
        }

    }

    // Envoyer un email de changement de statut
    const sendStatusChangeEmail = async (updatedTask) => {
        try {
            const responsableDoc = await getDoc(doc(db, "users", updatedTask.responsableId));

            if (!responsableDoc.exists()) {
                console.error("Responsable introuvable");
                return;
            }

            const responsableEmail = responsableDoc.data().email;
            const templateParams = {
                to_name: updatedTask.responsable,
                from_name: auth.currentUser?.email || "Admin",
                titre: updatedTask.titre,
                nouveau_statut: updatedTask.status,
                email: responsableEmail,
                asigne_par: updatedTask.utilisateurSoumettant || "Non spécifié",
            };

            await emailjs.send("service_xpgzkm5", "template_statuschange", templateParams);
            console.log("Email envoyé pour changement de statut :", updatedTask.titre);
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email pour changement de statut :", error);
        }
    };

    // Envoyer un email de réaffectation
    const sendReassignmentEmail = async (updatedTask) => {
        try {
            const responsableDoc = await getDoc(doc(db, "users", updatedTask.responsableId));

            if (!responsableDoc.exists()) {
                console.error("Responsable introuvable");
                return;
            }

            const responsableEmail = responsableDoc.data().email;
            const templateParams = {
                to_name: updatedTask.responsable,
                from_name: auth.currentUser?.email || "Admin",
                titre: updatedTask.titre,
                description: updatedTask.description,
                email: responsableEmail,
                assigne_par: updatedTask.utilisateurSoumettant || "Non spécifié",
            };

            await emailjs.send("service_xpgzkm5", "template_reassign", templateParams);
            console.log("Email envoyé pour réaffectation :", updatedTask.titre);
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email pour réaffectation :", error);
        }
    };

    if (!taskId) {
        return <div>Erreur : ID de la tâche introuvable.</div>;
    }

    return (
        <div className="container">
            <h2>Modifier la Tâche</h2>
            <form className="box">
                <div className="form-row">
                    <div className="form-group">
                        <label>Titre :</label>
                        <input
                            type="text"
                            name="titre"
                            value={task.titre}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Responsable :</label>
                        <select
                            name="responsableId"
                            value={task.responsableId}
                            onChange={handleResponsableChange}
                            disabled={currentUserRole !== "admin"}
                        >
                            <option value="">Sélectionner un responsable</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username} ({user.role})
                                </option>
                            ))}
                        </select>
                        {currentUserRole !== "admin" && (
                            <small className="text-muted">
                                Vous n'avez pas la permission de modifier le responsable.
                            </small>
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <label>Description :</label>
                    <textarea
                        name="description"
                        value={task.description}
                        onChange={handleInputChange}
                    ></textarea>
                </div>
                <div className="form-group">
                    <label>Priorité :</label>
                    <select
                        name="priorite"
                        value={task.priorite}
                        onChange={handleInputChange}
                    >
                        {priorities.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Status :</label>
                    <select
                        name="status"
                        value={task.status}
                        onChange={handleInputChange}
                    >
                        {statuses.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    className="button is-primary"
                    onClick={(e) => {
                        e.preventDefault();
                        handleUpdateTask();
                    }}
                >
                    Mettre à jour
                </button>
                <button className="button is-secondary" onClick={closeModal}>
                    Annuler
                </button>
            </form>
        </div>
    );
}
