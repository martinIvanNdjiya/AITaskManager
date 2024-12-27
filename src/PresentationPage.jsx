import React from "react";
import { useNavigate } from "react-router-dom";
import "./PresentationPage.css";

const PresentationPage = () => {
  const navigate = useNavigate(); // React Router hook for navigation

  return (
    <div className="home">
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-container">
          <h1 className="navbar-logo">
            <img 
              src="https://www.cmaisonneuve.qc.ca/wp-content/themes/cmaisonneuve/img/template/logo_college_maisonneuve.png" 
              alt="Logo du Collège Maisonneuve" 
            />
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>RJMY réunit toutes vos tâches, vos coéquipiers et vos outils</h1>
          <p>Gardez tout au même endroit, même si votre équipe ne l'est pas.</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/signIn")}>
              Inscrivez-vous - C'est gratuit !
            </button>
            <button className="btn-secondary" onClick={() => navigate("/#")}>
              En savoir plus
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Un outil de productivité puissant</h2>
          <p>Simple, flexible et puissant. Toutes vos tâches et projets organisés en un seul endroit.</p>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Gestion des tâches</h3>
              <p>Restez organisé et suivez votre travail.</p>
            </div>
            <div className="feature-card">
              <h3>Collaboration d'équipe</h3>
              <p>Rassemblez votre équipe avec des tableaux partagés.</p>
            </div>
            <div className="feature-card">
              <h3>Intégrations</h3>
              <p>Connectez vos outils préférés pour une meilleure productivité.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Travaillez plus intelligemment avec RJMY</h2>
        <p>Rejoignez des millions d'utilisateurs et simplifiez votre flux de travail.</p>
        <button className="btn-primary" onClick={() => navigate("/signIn")}>
          Commencez gratuitement
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p>© 2024 RJMY. Tous droits réservés.</p>
          <ul className="footer-links">
            <li><a href="/#">Politique de confidentialité</a></li>
            <li><a href="/#">Conditions d'utilisation</a></li>
            <li><a href="/#">Contactez-nous</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default PresentationPage;
