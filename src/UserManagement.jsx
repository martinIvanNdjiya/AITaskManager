import {useContext, useEffect, useState} from "react";
import {collection, doc, getDocs, updateDoc} from "firebase/firestore";
import {db, auth} from "./config/firebase-config.js";
import {signOut} from "firebase/auth";
import {pagination} from "./pagination.jsx";
import {Link} from "react-router-dom";
import { tokenContext } from './App.jsx';


export function UserManagement() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [tacheSelectionner, setTacheSelectionner] = useState({}); // State to track task selection per user
    const [taillePage, setTaillePage] = useState(8)
    const [pageCourante, setPageCourrante] = useState(1)

    function nbPages() {
        return Math.ceil(users.length / taillePage) + 1;
    }

    function paginer() {
        const debut = (pageCourante - 1) * taillePage;
        const fin = debut + taillePage
        return users.slice(debut, fin)
    }

    console.log(paginer())

    function tableauPage() {
        let tb = []
        for (let i = 1; i < nbPages(); i++) {
            tb.push(i)
        }
        return tb;
    }

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollection);
                const usersList = usersSnapshot.docs
                    .filter(doc => doc.data().role === "responsable")
                    .map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersList);
            } catch (err) {
                console.error("Échec du chargement des utilisateurs.", err);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const tasksCollection = collection(db, "Taches");
                const tasksSnapshot = await getDocs(tasksCollection);
                const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTasks(tasksList);
            } catch (err) {
                console.error("Échec du chargement des tâches admin.", err);
            }
        };
        fetchTasks();
    }, []);


    const handleModify = async (username) => {
        console.log('Selected Username:', username);
        console.log('Selected Task for User:', tacheSelectionner);
        console.log(tacheSelectionner[username])

        try {
            const task = tasks.find(task => task.titre === tacheSelectionner[username]);
            console.log('Tasks:', task);
            if (task && task.id) {
                const taskRef = doc(db, "Taches", task.id);
                console.log('Task Ref:', taskRef);
                await updateDoc(taskRef, {
                    responsable: username,
                });
                console.log(`Tâche assignée avec succès à ${username}`);
            } else {
                console.log('Tâche non trouvée ou ID invalide');
            }
        } catch (err) {
            console.error("Erreur lors de la modification de la tâche", err);
        }
    };

    return <div className="container">
        <div className="section">
            <div className="columns is-multiline is-mobile">
                {
                    users !== null &&
                    paginer().map((u) => {
                        return <div key={u.id} className="column is-3-desktop is-4-tablet is-6-mobile">
                            <div className="card has-text-black">
                                <div className="card-content">
                                    <div className="content">
                                        <h3 className="title is-4 has-text-centered has-text-black">Username: {u.username}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="field-body">
                                <div className="field">
                                    <div className="control" style={{minWidth: 200}}>
                                        <div className="select is-fullwidth">
                                            <select  value={tacheSelectionner[u.id] || ""}
                                                     onChange={(e) => setTacheSelectionner(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                     className="select">
                                                <option> Aucune tache</option>
                                                {
                                                    tasks.map((t) => <option key={t.id} value={t.titre}>{t.titre}</option>)
                                                }
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-warning" onClick={() => handleModify(u.username)} disabled={!tacheSelectionner[u.id]}>
                                Assigner
                            </button>
                        </div>
                    })
                }
            </div>
        </div>
        <nav className="pagination" role="navigation" aria-label="pagination">
            {pagination(pageCourante, setPageCourrante, nbPages, tableauPage)}
        </nav>
        <div className="control" style={{minWidth: 200}} role="Nombre d'users par page">
            <div className="select">
                <select value={taillePage} onChange={(e) => setTaillePage(Number(e.target.value))}>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                </select>
            </div>
        </div>
    </div>
}