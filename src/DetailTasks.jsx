import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth, storage } from "./config/firebase-config";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import "./DetailTasks.css";
import { UpdTask } from "./UpdTask";
import { openai } from './config/openAi-config';
// import PropTypes from 'prop-types';

export function DetailsTask() {
    const { id: taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [activeTab, setActiveTab] = useState("messages");
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleEditTask = () => {
        setSelectedTaskId(taskId);
        setIsEditModalOpen(true);
    };


    useEffect(() => {
        
        const fetchTaskDetails = async () => {
            try {
                if (!taskId) {
                    console.error("L'ID de la tâche est manquant.");
                    return;
                }
        
                const taskDoc = await getDoc(doc(db, "Taches", taskId));
                if (taskDoc.exists()) {
                    const taskData = taskDoc.data();
        
                    // Récupération du username depuis Firestore
                    if (taskData.responsableId) {
                        const userDoc = await getDoc(doc(db, "users", taskData.responsableId));
                        if (userDoc.exists()) {
                            taskData.responsable = userDoc.data().username || "Inconnu";
                        } else {
                            taskData.responsable = "Inconnu";
                        }
                    } else {
                        taskData.responsable = "Inconnu";
                    }
        
                    setTask({ id: taskDoc.id, ...taskData });
                } else {
                    console.error("La tâche n'a pas été trouvée.");
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des détails de la tâche :", error);
            }
        };

        fetchTaskDetails();
    }, [taskId]);

    if (!task) {
        return <div>Chargement des détails de la tâche...</div>;
    }




    return (
        <div className="details-container">
            <header className="details-header">
                <h1>{task.titre}</h1>
            </header>
            <div className="nav-button is-flex is-justify-content-space-between is-align-items-center mb-3">
                <button className="button is-link is-light mr-3" onClick={() => navigate(-1)}>
                    ← Retour
                </button>
                <button className="button is-primary ml-3" onClick={handleEditTask}>
                    Modifier
                </button>
            </div>
            <div className="details-content">
                <div className="details-section">
                    <h2>Détails</h2>
                    <p className="has-text-dark">
                        <strong>Responsable :</strong> {task.responsable || "Inconnue"}
                    </p>
                    <p className="has-text-dark">
                        <strong>Priorité :</strong>{" "}
                        <span className={`priority-${task.priorite.replace(/\s+/g, "-")}`}>
                            {task.priorite}
                        </span>
                    </p>
                    <p className="has-text-dark">
                        <strong>Statut :</strong>{" "}
                        <span className={`status-${task.status.replace(/\s+/g, "-")}`}>
                            {task.status}
                        </span>
                    </p>
                    <p className="has-text-dark">
                        <strong>Date de soumission :</strong> {task.dateSoumission || "Inconnue"}
                    </p>
                    <p>
                        <strong>Description :</strong> {task.description}
                    </p>
                </div>

                <div className="tabs-section">
                    <div className="tabs">
                        <button
                            className={activeTab === "messages" ? "active" : ""}
                            onClick={() => setActiveTab("messages")}
                        >
                            Messages
                        </button>
                        <button
                            className={activeTab === "openai" ? "active" : ""}
                            onClick={() => setActiveTab("openai")}
                        >
                            Plan d'intervention
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === "messages" && <MessagesSection taskId={taskId} />}
                        {activeTab === "openai" && <OpenAISection task={task} />}
                    </div>
                </div>
            </div>

            {isEditModalOpen && selectedTaskId && (
                <div className="modal">
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            ×
                        </button>
                        <UpdTask taskId={selectedTaskId} closeModal={() => setIsEditModalOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}

const OpenAISection = ({ taskId, task }) => {
    const [plan, setPlan] = useState(task?.planIntervention?.content || ""); // Extract content
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleGeneratePlan = async () => {
        if (!task) {
            console.warn("La tâche est indéfinie. Impossible de générer un plan.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Générer un plan d'intervention d'une heure basé sur la description de la tâche.",
                    },
                    {
                        role: "user",
                        content: `Titre de la tâche : ${task.titre}\nDescription : ${task.description}`,
                    },
                ],
                max_tokens: 300,
            });

            const generatedPlan = response?.data?.choices?.[0]?.message?.content;

            if (typeof generatedPlan === "string") {
                console.log("Plan généré :", generatedPlan);

                const newPlan = { content: generatedPlan, role: "assistant", refusal: null };
                setPlan(newPlan.content);
                await updateDoc(doc(db, "Taches", taskId), { planIntervention: newPlan });
            } else {
                console.error("Aucun contenu valide de plan retourné par l'API.");
                setPlan("Aucun plan généré. Veuillez réessayer.");
            }
        } catch (error) {
            console.error("Erreur lors de la génération du plan :", error);
            setPlan("Erreur lors de la génération du plan. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePlan = async () => {
        try {
            const newPlan = { content: plan, role: "assistant", refusal: null };
            await updateDoc(doc(db, "Taches", taskId), { planIntervention: newPlan });
            setIsEditing(false);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du plan :", error);
        }
    };

    return (
        <div className="openai-section">
            <h2>Plan d'intervention</h2>
            <div className="chat-history">
                {!isEditing ? (
                    <div className="chat-message assistant">
                        <p>{plan || "Aucun plan disponible. Générer un plan pour commencer."}</p>
                    </div>
                ) : (
                    <textarea
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="plan-input"
                        rows="10"
                    />
                )}
            </div>
            <div className="chat-input">
                {isEditing ? (
                    <>
                        <button onClick={handleSavePlan} disabled={isLoading}>
                            {isLoading ? "Sauvegarde en cours..." : "Sauvegarder le plan"}
                        </button>
                        <button onClick={() => setIsEditing(false)}>Annuler</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)}>Modifier le plan</button>
                        <button onClick={handleGeneratePlan} disabled={isLoading}>
                            {isLoading ? "Génération en cours..." : "Générer un plan"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};


const MessagesSection = ({ taskId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [editingMessages, setEditingMessages] = useState("");
    const [sujet, setsujet] = useState("");
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const PhotoURLInconnuePlaceholder =
        "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50";
    const currentUser = auth.currentUser;

    useEffect(() => {
        const taskDoc = doc(db, "Taches", taskId);

        const unsubscribe = onSnapshot(taskDoc, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const taskData = docSnapshot.data();
                setMessages(taskData.suiviCommentaires || []);
            } else {
                console.error("Task not found or has no comments.");
            }
        });

        return () => unsubscribe();
    }, [taskId]);


    const handleDelete = async (index) => {
        try {
            const updatedMessages = messages.filter((_, i) => i !== index);
            const taskDoc = doc(db, "Taches", taskId);
            await updateDoc(taskDoc, { suiviCommentaires: updatedMessages });
            setMessages(updatedMessages);
        } catch (error) {
            console.error("Erreur lors de la suppression du message :", error);
        }
    };

    const handleEdit = (index) => {
        setEditingMessages((prevState) => ({
            ...prevState,
            [index]: messages[index].message,
        }));
    };

    const handleSaveEdit = async (index) => {
        try {
            const updatedMessages = [...messages];
            updatedMessages[index].message = editingMessages[index];
            const taskDoc = doc(db, "Taches", taskId);
            await updateDoc(taskDoc, { suiviCommentaires: updatedMessages });
            setMessages(updatedMessages);
            setEditingMessages((prevState) => {
                const { [index]: _, ...rest } = prevState;
                return rest;
            });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des modifications du message :", error);
        }
    };

    const fetchUserProfilePicture = async (uid) => {
        const PhotoURLInconnuePlaceholder =
            "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50";

        if (!uid) {
            console.warn("Invalid UID passed to fetchUserProfilePicture:", uid);
            return PhotoURLInconnuePlaceholder;
        }

        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                return userDoc.data().profilePicture || PhotoURLInconnuePlaceholder;
            }
        } catch (error) {
            console.error("Error fetching user profile picture:", error);
        }

        return PhotoURLInconnuePlaceholder;
    };

    const handleCancelEdit = (index) => {
        setEditingMessages((prevState) => {
            const { [index]: _, ...rest } = prevState;
            return rest;
        })
    }

    useEffect(() => {

        
        const fetchMessagesWithUpdatedProfiles = async () => {
            try {
                const taskDoc = await getDoc(doc(db, "Taches", taskId));
                if (taskDoc.exists()) {
                    const taskData = taskDoc.data();
                    const updatedMessages = await Promise.all(
                        (taskData.suiviCommentaires || []).map(async (msg) => {
                            const userDoc = await getDoc(doc(db, "users", msg.auteur_id));
                            const username = userDoc.exists() ? userDoc.data().username : "Inconnu";
                            return {
                                ...msg,
                                auteur: username,
                                profilePicture: msg.profilePicture || PhotoURLInconnuePlaceholder,
                            };
                        })
                    );
                    setMessages(updatedMessages);
                } else {
                    console.error("Les messages de la tâche n'ont pas été trouvés.");
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des messages avec mises à jour :", error);
            }
        };

        fetchMessagesWithUpdatedProfiles();
    }, [taskId]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSend = async () => {

        let fileURL = null;
        let fileName = null;

        if (file) {
            const fileRef = ref(storage, `Taches/${taskId}/${file.name}`);
            await uploadBytes(fileRef, file);
            fileURL = await getDownloadURL(fileRef);
            fileName = file.name;
        }

        const newComment = {
            sujet,
            message: newMessage,
            fichier: fileURL || null,
            fichierNom: fileName || null,
            auteur_id: currentUser?.uid,
            auteur: currentUser?.displayName || currentUser?.email || "Anonyme",
            email: currentUser?.email || "Inconnue",
            profilePicture: await fetchUserProfilePicture(currentUser?.uid),
            date: new Date().toLocaleString(),
        };

        try {
            const taskDoc = doc(db, "Taches", taskId);
            const updatedMessages = [newComment, ...messages];
            await updateDoc(taskDoc, { suiviCommentaires: updatedMessages });
            setMessages(updatedMessages);
            setsujet("");
            setNewMessage("");
            setFile(null);

            // Reset file input field
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        } catch (error) {
            console.error("Erreur lors de l'ajout du message :", error);
        }
    };

    const renderFile = (fileURL, fileName) => {
        const isImage = /\.(jpeg|jpg|png|gif|bmp|webp|svg)$/i.test(fileName || "");

        if (isImage) {
            return <img src={fileURL} alt="Image" className="uploaded-image" />;
        }

        return (
            <a href={fileURL} target="_blank" rel="noopener noreferrer">
                {fileName || "Fichier"}
            </a>
        );
    };

    return (
        <div className="messages-section">
            <div className="message-form">
                <input
                    type="text"
                    placeholder="Sujet"
                    value={sujet}
                    onChange={(e) => setsujet(e.target.value)}
                />
                <textarea
                    placeholder="Message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button onClick={handleSend}>Envoyer</button>
            </div>
            <div className="messages-list">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${currentUser?.email === msg.email ? "message-outgoing" : "message-incoming"

                            }`}
                    >
                        <img
                            src={msg.profilePicture || PhotoURLInconnuePlaceholder}
                            alt={`Profil de ${msg.auteur}`}
                            className="message-profile-picture"
                        />

                        <div className="message-content">

                            <h3 className="message-subject">{msg.sujet}</h3>
                            {msg.fichier && renderFile(msg.fichier, msg.fichierNom)}
                            <span className="message-meta">{msg.date} - {msg.auteur}</span>
                            {editingMessages[index] !== undefined ? (
                                <>
                                    <textarea
                                        value={editingMessages[index]}
                                        onChange={(e) =>
                                            setEditingMessages((prevState) => ({
                                                ...prevState,
                                                [index]: e.target.value,
                                            }))
                                        }
                                    />
                                    <div className="message-actions">
                                        <button
                                            onClick={() => handleSaveEdit(index)}
                                            className="btn-save-message"
                                        >
                                            <FontAwesomeIcon icon={faSave} /> Enregistrer
                                        </button>
                                        <button
                                            onClick={() => handleCancelEdit(index)}
                                            className="btn-cancel-edit"
                                        >
                                            <FontAwesomeIcon icon={faTimes} /> Annuler
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="message-text">{msg.message}</p>
                            )}
                        </div>
                        {currentUser?.email === msg.email && editingMessages[index] === undefined && (
                            <div className="message-actions">
                                <button
                                    onClick={() => handleEdit(index)}
                                    className="btn-edit-message"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                    onClick={() => handleDelete(index)}
                                    className="btn-delete-message"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DetailsTask;
