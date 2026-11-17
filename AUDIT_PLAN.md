# KidMission — Plan des 10 corrections prioritaires
**Branche :** `grok-reprise`  
**Date :** 17 novembre 2026  
**Règle :** ne pas toucher à `main` ni casser l’existant. Une correction à la fois.

## Statut des 10 priorités

| # | Correction | Statut | Notes |
|---|------------|--------|-------|
| 1 | Retirer clés Firebase du README | **FAIT** | Commit déjà poussé sur cette branche |
| 2 | Vérifier / renforcer règles Firestore + tests d’isolation | À FAIRE | Règles actuelles solides, audit approfondi en cours |
| 3 | Tag de référence + sauvegarde | PARTIEL | Branche créée ; tag à ajouter |
| 4 | Tests parcours parent/enfant de bout en bout | À FAIRE | Site live fonctionnel, tests manuels à documenter |
| 5 | Gestion abonnements + contrôle des droits | ABSENT | Pas encore d’IAP |
| 6 | Suppression de compte + export données | ABSENT | À concevoir |
| 7 | Finaliser pages légales | PARTIEL | Fichiers présents dans public/ |
| 8 | Audit appels externes (MyMemory) | IDENTIFIÉ | Utilisé pour EN/RU, cache localStorage |
| 9 | Préparer Capacitor (base) | ABSENT | PWA ok pour l’instant |
| 10 | Registre de bugs + tests non-régression | À CRÉER | Ce fichier sert de début |

## Audit approfondi — Règles Firestore

Les règles actuelles (identiques au repo) sont bien conçues :
- Isolation par famille et par enfant (`isParent` / `isSelf`).
- Enfant ne peut créer que des entrées/claims en `pending` avec son propre `uid` + timestamp serveur.
- Parent seul peut approuver / modifier / supprimer.
- Pas de promotion de rôle possible.
- Suppression de profil enfant désactivée côté client (volontaire).

**Points à surveiller (pas bloquants immédiatement) :**
- Aucun test automatisé d’autorisation.
- Collection-group queries possibles via membership (utilisé pour findFamilyIdForUid).
- Pas de règle explicite contre lecture inter-familles hors membership.

## Audit approfondi — Parcours

- Onboarding 7 étapes : présent et fonctionnel (`OnboardingTour`).
- ChildHome : calculs de solde (money + jokers), jokers liés aux malus petits, feedback, streak.
- Traduction : MyMemory appelé côté client pour EN/RU (risque vie privée si texte personnalisé envoyé).
- Site live : accueil OK, builds Netlify volontairement arrêtés.

## Prochaine correction (n°2 / n°3)

- Ajouter un tag de référence sur le commit actuel de main.
- Documenter les cas de test d’isolation à exécuter manuellement.

---
*Aucune modification de code métier pour l’instant. Seulement documentation et sécurisation.*
