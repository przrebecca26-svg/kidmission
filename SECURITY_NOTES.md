# Notes de sécurité — KidMission
**Branche :** `grok-reprise`  
**Date :** 17 novembre 2026

## Points déjà solides (ne pas toucher)
- Isolation famille / enfant via `isParent` et `isSelf`.
- Enfant ne peut créer que des documents `pending` avec son propre uid + timestamp serveur.
- Parent seul peut approuver, modifier ou supprimer.
- Impossible pour un enfant de se promouvoir en parent.
- Suppression de profil enfant désactivée côté client (volontaire).

## Points à renforcer (prochaines étapes)
1. **Tests d’isolation manuels** — voir `TEST_PARCOURS.md` (section Isolation).
2. **Cloud Function pour suppression de compte** — nécessaire pour effacer proprement Auth + toutes les données de la famille (sécurisé, pas depuis le client).
3. **Export complet** — idem, via Function pour garantir l’exhaustivité et la sécurité.
4. **MyMemory** — les appels de traduction côté client envoient du texte à un tiers. À remplacer par des traductions statiques ou désactiver pour les labels personnalisés.
5. **Abonnements** — contrôle des droits (famille active / expirée) à ajouter dans les règles ou via claims personnalisés une fois les paiements en place.

## Règles actuelles
Les `firestore.rules` sont conservées telles quelles. Aucune modification pour l’instant afin de ne pas risquer de casser les familles existantes.

---
*Aucune donnée de famille réelle n’a été touchée.*
