# Fiches stores — App Store & Google Play
**Branche :** `grok-reprise`  
**Date :** 17 novembre 2026  
**Statut :** brouillons à valider et à compléter avec captures d’écran réelles.

## Informations communes
- **Nom :** KidMission
- **Sous-titre / short description :** Carnet de missions et récompenses en famille
- **Catégorie :** Éducation / Productivité / Famille
- **Âge :** 4+ (avec contrôle parental)
- **Prix :** Gratuit avec abonnement (essai 7 jours)
- **Langues :** Français, Hébreu, Anglais, Russe

## App Store (Apple)
### Description
KidMission aide les parents à suivre les missions du quotidien de leurs enfants (bonus, malus, jokers, récompenses et versements) dans un carnet simple et sécurisé.

- Crée des profils enfants avec récompenses personnalisables (argent, temps d’écran, points)
- L’enfant déclare ses missions, le parent valide
- Historique, soldes et versements clairs
- Données isolées par famille

### Points importants pour la review Apple
- App destinée aux familles avec contrôle parental fort
- Pas de collecte directe auprès des enfants
- Suppression de compte + export des données disponibles
- Abonnement avec essai gratuit de 7 jours géré par le store
- Politique de confidentialité et CGU accessibles

### Captures nécessaires (minimum)
- Écran d’accueil parent (liste des enfants)
- Écran enfant (missions / solde)
- Onboarding
- Réglages / Compte et données

## Google Play
### Description courte
Missions, récompenses et suivi familial simple pour les parents.

### Description longue
(Même contenu que l’App Store, adapté si besoin.)

### Points Google
- Classification de contenu : faible (famille)
- Formulaire de sécurité des données à remplir (Firebase, pas de pub, suppression possible)

## Tests recommandés avant soumission
Voir aussi `TEST_PARCOURS.md`.

### Sur iPhone réel
- [ ] Installation via TestFlight
- [ ] Connexion parent + enfant
- [ ] Déclaration + validation de mission
- [ ] Versement et reset de solde
- [ ] Export des données
- [ ] Demande de suppression
- [ ] Rotation / mode sombre (si applicable)
- [ ] Notifications (si ajoutées plus tard)

### Sur Android réel
- [ ] Installation via internal testing
- [ ] Mêmes parcours que ci-dessus
- [ ] Bouton retour système
- [ ] Différentes tailles d’écran

## Prochaines actions
1. Générer les projets natifs (voir `CAPACITOR.md`).
2. Faire des captures d’écran sur vrais appareils.
3. Remplir les fiches dans App Store Connect et Google Play Console.
4. Audit final par Claude avant soumission.
