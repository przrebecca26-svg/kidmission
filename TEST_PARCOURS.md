# Checklist de tests manuels — Parcours, Isolation & Appareils
**Branche :** `grok-reprise`  
**Date :** 17 novembre 2026

## Parcours Parent (web ou natif)
- [ ] Inscription nouveau compte parent
- [ ] Connexion / déconnexion
- [ ] Création d’un premier enfant (profil + login username + code)
- [ ] Onboarding tour (7 étapes) se déclenche
- [ ] Ajout d’un second enfant
- [ ] Ouverture écran enfant → déclaration bonus / malus / joker
- [ ] Validation / refus d’une entrée pending
- [ ] Enregistrement d’un versement
- [ ] Consultation solde (doit se reset après versement)
- [ ] Accès à « Compte et données » → liens légaux + export + demande de suppression

## Parcours Enfant
- [ ] Connexion avec username + code 6 chiffres
- [ ] Voir uniquement ses propres missions
- [ ] Déclarer une mission (devient pending)
- [ ] Ne pas pouvoir approuver soi-même
- [ ] Voir solde et historique
- [ ] Demander une récompense

## Isolation inter-familles (critique)
- [ ] Compte parent A ne peut pas lire les données de la famille B
- [ ] Enfant de A ne peut pas accéder aux données de B
- [ ] Tentative de modifier un enfant d’une autre famille → refus

## Tests sur vrais appareils (avant stores)
### iPhone
- [ ] Installation (TestFlight ou ad-hoc)
- [ ] Tous les parcours ci-dessus
- [ ] Safe area / notch
- [ ] Mode portrait uniquement

### Android
- [ ] Installation (internal testing)
- [ ] Tous les parcours ci-dessus
- [ ] Bouton retour système
- [ ] Différentes densités d’écran

## Résultats

| Test | Appareil | Date | Résultat | Notes |
|------|----------|------|----------|-------|
| | | | | |

*Remplir au fur et à mesure des tests réels.*
