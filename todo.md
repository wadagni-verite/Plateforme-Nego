# Digital War Room - TODO

## Phase 1: Architecture et Base de données
- [x] Définir le schéma de base de données complet
- [x] Créer les tables: users (avec rôles étendus), documents, categories, actors, timeline_events, audit_logs, document_permissions
- [x] Configurer les relations entre tables
- [x] Pousser les migrations avec pnpm db:push

## Phase 2: Authentification et Gestion des Rôles
- [x] Étendre le système d'authentification avec rôles: Admin, Avocat, Expert, Observateur
- [x] Créer le système de permissions granulaires par catégorie documentaire
- [x] Implémenter les procédures tRPC protégées par rôle
- [x] Créer la page de gestion des acteurs avec CRUD complet

## Phase 3: Système de Gestion Documentaire
- [x] Créer les 15 catégories documentaires prédéfinies
- [x] Implémenter l'upload de documents avec stockage S3
- [x] Générer le hash SHA-256 pour chaque document uploadé
- [x] Créer le système d'horodatage avec certificat d'intégrité
- [x] Stocker les métadonnées (nom, taille, type MIME, auteur, date, hash)
- [x] Implémenter la visualisation et le téléchargement de documents

## Phase 4: Interface Utilisateur Élégante
- [x] Définir le design system (palette juridique: bleu marine, or, gris ardoise)
- [x] Configurer les fonts professionnelles (Inter, Playfair Display)
- [x] Créer le DashboardLayout avec navigation sophistiquée
- [x] Implémenter les composants UI réutilisables avec shadcn/ui
- [x] Créer les animations subtiles et transitions élégantes

## Phase 5: Tableau de Bord Stratégique
- [x] Créer la page Dashboard avec métriques clés
- [x] Implémenter la visualisation de la répartition des documents par catégorie (graphique circulaire)
- [x] Créer la timeline des événements récents
- [x] Afficher les statistiques: total documents, acteurs, événements
- [x] Créer les widgets d'activité récente et documents récents

## Phase 6: Chronologie Interactive
- [ ] Créer la page Timeline avec affichage chronologique des événements
- [ ] Implémenter les filtres par type d'événement (upload, consultation, modification)
- [ ] Ajouter la recherche par mots-clés dans la timeline
- [ ] Créer l'interface d'ajout manuel d'événements clés
- [ ] Implémenter la visualisation détaillée de chaque événement

## Phase 7: Système de Recherche Avancée
- [ ] Créer la page de recherche avec formulaire multi-critères
- [ ] Implémenter la recherche par nom de fichier
- [ ] Ajouter les filtres par catégorie, date, auteur
- [ ] Implémenter le système de tags pour les documents
- [ ] Créer l'affichage des résultats avec pagination

## Phase 8: Journal d'Audit
- [ ] Créer le système de logging automatique de toutes les actions
- [ ] Implémenter la page Audit Log avec tableau complet
- [ ] Ajouter les filtres par type d'action, acteur, date
- [ ] Créer l'export CSV du journal d'audit
- [ ] Implémenter la visualisation détaillée de chaque action

## Phase 9: Export PDF et Rapports
- [ ] Créer le système de génération de rapports PDF
- [ ] Implémenter l'inventaire documentaire complet en PDF
- [ ] Générer la timeline des événements en PDF
- [ ] Inclure les statistiques et métriques dans le rapport
- [ ] Ajouter les preuves d'horodatage et certificats d'intégrité

## Phase 10: Système Bilingue FR/EN
- [ ] Créer le contexte de langue avec React Context
- [ ] Implémenter le switch de langue persistant (localStorage)
- [ ] Traduire tous les textes de l'interface (FR/EN)
- [ ] Créer les fichiers de traduction structurés
- [ ] Tester toutes les pages dans les deux langues

## Phase 11: Tests et Qualité
- [ ] Écrire les tests vitest pour l'authentification
- [ ] Tester les procédures tRPC de gestion documentaire
- [ ] Tester le système de permissions
- [ ] Tester la génération de hash et horodatage
- [ ] Tester l'export PDF

## Phase 12: Finalisation
- [ ] Vérifier la responsivité sur tous les écrans
- [ ] Optimiser les performances
- [ ] Vérifier l'accessibilité (WCAG)
- [ ] Créer la documentation utilisateur
- [ ] Créer le checkpoint final
