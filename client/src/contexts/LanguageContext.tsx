import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    "nav.dashboard": "Tableau de Bord",
    "nav.documents": "Documents",
    "nav.timeline": "Chronologie",
    "nav.search": "Recherche",
    "nav.actors": "Acteurs",
    "nav.audit": "Journal d'Audit",
    "nav.case": "Dossier",
    
    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.view": "Voir",
    "common.upload": "Téléverser",
    "common.download": "Télécharger",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.export": "Exporter",
    "common.back": "Retour",
    "common.next": "Suivant",
    "common.previous": "Précédent",
    "common.confirm": "Confirmer",
    "common.close": "Fermer",
    
    // Dashboard
    "dashboard.title": "Tableau de Bord Stratégique",
    "dashboard.welcome": "Bienvenue",
    "dashboard.stats.total_documents": "Documents Totaux",
    "dashboard.stats.total_actors": "Acteurs",
    "dashboard.stats.total_events": "Événements",
    "dashboard.stats.case_value": "Valeur du Dossier",
    "dashboard.recent_activity": "Activité Récente",
    "dashboard.recent_documents": "Documents Récents",
    "dashboard.documents_by_category": "Documents par Catégorie",
    "dashboard.timeline_preview": "Chronologie Récente",
    
    // Documents
    "documents.title": "Gestion Documentaire",
    "documents.upload": "Téléverser un Document",
    "documents.category": "Catégorie",
    "documents.file_name": "Nom du Fichier",
    "documents.file_size": "Taille",
    "documents.uploaded_by": "Téléversé par",
    "documents.uploaded_at": "Date de Téléversement",
    "documents.description": "Description",
    "documents.tags": "Tags",
    "documents.sha256": "Hash SHA-256",
    "documents.timestamp_proof": "Preuve d'Horodatage",
    "documents.select_category": "Sélectionner une catégorie",
    "documents.select_file": "Sélectionner un fichier",
    "documents.drag_drop": "Glisser-déposer ou cliquer pour sélectionner",
    "documents.upload_success": "Document téléversé avec succès",
    "documents.upload_error": "Erreur lors du téléversement",
    "documents.delete_confirm": "Êtes-vous sûr de vouloir supprimer ce document ?",
    "documents.no_documents": "Aucun document",
    
    // Timeline
    "timeline.title": "Chronologie Interactive",
    "timeline.add_event": "Ajouter un Événement",
    "timeline.event_type": "Type d'Événement",
    "timeline.event_title": "Titre",
    "timeline.event_description": "Description",
    "timeline.event_date": "Date",
    "timeline.filter_by_type": "Filtrer par Type",
    "timeline.search_events": "Rechercher des événements",
    "timeline.no_events": "Aucun événement",
    
    // Search
    "search.title": "Recherche Avancée",
    "search.query": "Recherche",
    "search.start_date": "Date de Début",
    "search.end_date": "Date de Fin",
    "search.uploaded_by": "Téléversé par",
    "search.results": "Résultats",
    "search.no_results": "Aucun résultat trouvé",
    
    // Actors
    "actors.title": "Gestion des Acteurs",
    "actors.add": "Ajouter un Acteur",
    "actors.name": "Nom",
    "actors.email": "Email",
    "actors.role": "Rôle",
    "actors.organization": "Organisation",
    "actors.phone": "Téléphone",
    "actors.status": "Statut",
    "actors.active": "Actif",
    "actors.inactive": "Inactif",
    "actors.last_login": "Dernière Connexion",
    "actors.created_at": "Créé le",
    
    // Roles
    "role.admin": "Administrateur",
    "role.avocat": "Avocat",
    "role.expert": "Expert",
    "role.observateur": "Observateur",
    
    // Audit
    "audit.title": "Journal d'Audit",
    "audit.action": "Action",
    "audit.user": "Utilisateur",
    "audit.entity": "Entité",
    "audit.details": "Détails",
    "audit.timestamp": "Horodatage",
    "audit.ip_address": "Adresse IP",
    "audit.export_csv": "Exporter en CSV",
    
    // Case
    "case.title": "Informations du Dossier",
    "case.case_number": "Numéro de Dossier",
    "case.description": "Description",
    "case.amount": "Montant",
    "case.currency": "Devise",
    "case.status": "Statut",
    "case.client_name": "Nom du Client",
    "case.opposing_party": "Partie Adverse",
    "case.jurisdiction": "Juridiction",
    "case.start_date": "Date de Début",
    "case.expected_end_date": "Date de Fin Prévue",
    "case.status.active": "Actif",
    "case.status.pending": "En Attente",
    "case.status.closed": "Fermé",
    "case.status.archived": "Archivé",
    
    // Categories
    "category.expertise_reports": "Rapports d'Expertise et Études Techniques",
    "category.property_proofs": "Inventaires et Preuves de Propriété",
    "category.property_titles": "Titres de Propriété et Documents Fonciers",
    "category.damage_proofs": "Preuves de la Matérialité des Dommages",
    "category.correspondence": "Correspondances et Actes d'Huissier",
    "category.health_moral": "Santé et Préjudice Moral",
    "category.site_reports": "État des lieux et Constats",
    "category.legal_fees": "Honoraires d'avocat et Frais de Justice",
    "category.formal_notices": "Mises en Demeure et Sommations",
    "category.agreements": "Protocoles d'Accord",
    "category.summons": "Assignations et Citations",
    "category.jurisprudence": "Jurisprudence et Précédents",
    "category.media_proofs": "Preuves Photographiques et Vidéos",
    "category.contracts": "Contrats et Engagements Commerciaux",
    "category.others": "AUTRES (Documents divers)",
    
    // Event Types
    "event.document_upload": "Téléversement de Document",
    "event.document_view": "Consultation de Document",
    "event.document_edit": "Modification de Document",
    "event.document_delete": "Suppression de Document",
    "event.user_login": "Connexion Utilisateur",
    "event.user_action": "Action Utilisateur",
    "event.milestone": "Jalon",
    "event.meeting": "Réunion",
    "event.deadline": "Échéance",
    "event.custom": "Personnalisé",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.documents": "Documents",
    "nav.timeline": "Timeline",
    "nav.search": "Search",
    "nav.actors": "Actors",
    "nav.audit": "Audit Log",
    "nav.case": "Case",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.upload": "Upload",
    "common.download": "Download",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.confirm": "Confirm",
    "common.close": "Close",
    
    // Dashboard
    "dashboard.title": "Strategic Dashboard",
    "dashboard.welcome": "Welcome",
    "dashboard.stats.total_documents": "Total Documents",
    "dashboard.stats.total_actors": "Actors",
    "dashboard.stats.total_events": "Events",
    "dashboard.stats.case_value": "Case Value",
    "dashboard.recent_activity": "Recent Activity",
    "dashboard.recent_documents": "Recent Documents",
    "dashboard.documents_by_category": "Documents by Category",
    "dashboard.timeline_preview": "Recent Timeline",
    
    // Documents
    "documents.title": "Document Management",
    "documents.upload": "Upload Document",
    "documents.category": "Category",
    "documents.file_name": "File Name",
    "documents.file_size": "Size",
    "documents.uploaded_by": "Uploaded By",
    "documents.uploaded_at": "Upload Date",
    "documents.description": "Description",
    "documents.tags": "Tags",
    "documents.sha256": "SHA-256 Hash",
    "documents.timestamp_proof": "Timestamp Proof",
    "documents.select_category": "Select a category",
    "documents.select_file": "Select a file",
    "documents.drag_drop": "Drag and drop or click to select",
    "documents.upload_success": "Document uploaded successfully",
    "documents.upload_error": "Error uploading document",
    "documents.delete_confirm": "Are you sure you want to delete this document?",
    "documents.no_documents": "No documents",
    
    // Timeline
    "timeline.title": "Interactive Timeline",
    "timeline.add_event": "Add Event",
    "timeline.event_type": "Event Type",
    "timeline.event_title": "Title",
    "timeline.event_description": "Description",
    "timeline.event_date": "Date",
    "timeline.filter_by_type": "Filter by Type",
    "timeline.search_events": "Search events",
    "timeline.no_events": "No events",
    
    // Search
    "search.title": "Advanced Search",
    "search.query": "Search",
    "search.start_date": "Start Date",
    "search.end_date": "End Date",
    "search.uploaded_by": "Uploaded By",
    "search.results": "Results",
    "search.no_results": "No results found",
    
    // Actors
    "actors.title": "Actor Management",
    "actors.add": "Add Actor",
    "actors.name": "Name",
    "actors.email": "Email",
    "actors.role": "Role",
    "actors.organization": "Organization",
    "actors.phone": "Phone",
    "actors.status": "Status",
    "actors.active": "Active",
    "actors.inactive": "Inactive",
    "actors.last_login": "Last Login",
    "actors.created_at": "Created At",
    
    // Roles
    "role.admin": "Administrator",
    "role.avocat": "Lawyer",
    "role.expert": "Expert",
    "role.observateur": "Observer",
    
    // Audit
    "audit.title": "Audit Log",
    "audit.action": "Action",
    "audit.user": "User",
    "audit.entity": "Entity",
    "audit.details": "Details",
    "audit.timestamp": "Timestamp",
    "audit.ip_address": "IP Address",
    "audit.export_csv": "Export to CSV",
    
    // Case
    "case.title": "Case Information",
    "case.case_number": "Case Number",
    "case.description": "Description",
    "case.amount": "Amount",
    "case.currency": "Currency",
    "case.status": "Status",
    "case.client_name": "Client Name",
    "case.opposing_party": "Opposing Party",
    "case.jurisdiction": "Jurisdiction",
    "case.start_date": "Start Date",
    "case.expected_end_date": "Expected End Date",
    "case.status.active": "Active",
    "case.status.pending": "Pending",
    "case.status.closed": "Closed",
    "case.status.archived": "Archived",
    
    // Categories
    "category.expertise_reports": "Expertise Reports and Technical Studies",
    "category.property_proofs": "Inventories and Property Proofs",
    "category.property_titles": "Property Titles and Land Documents",
    "category.damage_proofs": "Material Damage Proofs",
    "category.correspondence": "Correspondence and Bailiff Acts",
    "category.health_moral": "Health and Moral Damage",
    "category.site_reports": "Site Reports and Findings",
    "category.legal_fees": "Legal Fees and Court Costs",
    "category.formal_notices": "Formal Notices and Summons",
    "category.agreements": "Agreements and Protocols",
    "category.summons": "Summons and Citations",
    "category.jurisprudence": "Case Law and Precedents",
    "category.media_proofs": "Photographic and Video Evidence",
    "category.contracts": "Contracts and Commercial Commitments",
    "category.others": "OTHERS (Miscellaneous Documents)",
    
    // Event Types
    "event.document_upload": "Document Upload",
    "event.document_view": "Document View",
    "event.document_edit": "Document Edit",
    "event.document_delete": "Document Delete",
    "event.user_login": "User Login",
    "event.user_action": "User Action",
    "event.milestone": "Milestone",
    "event.meeting": "Meeting",
    "event.deadline": "Deadline",
    "event.custom": "Custom",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("language");
    return (stored === "en" || stored === "fr") ? stored : "fr";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
