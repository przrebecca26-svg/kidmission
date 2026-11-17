# KidMission — Plan des 10 corrections prioritaires
**Branche :** `grok-reprise`  
**Date :** 17 novembre 2026  
**Règle :** ne pas toucher à `main` ni casser l’existant.

## Statut des priorités (mis à jour)

| # | Correction | Statut | Notes |
|---|------------|--------|-------|
| 1 | Retirer clés Firebase du README | **FAIT** | |
| 2 | Audit règles + isolation | **EN COURS** | Documenté |
| 3 | Branche de travail | **FAIT** | `grok-reprise` |
| 4 | Tests parcours | **PRÉPARÉ** | `TEST_PARCOURS.md` |
| 5 | Abonnements | ABSENT | Prochaine étape après légal |
| 6 | Suppression de compte + export | **PRÉPARÉ** | Écran `AccountSettings` ajouté (export demo + demande de suppression) |
| 7 | Pages légales | **FAIT** | `public/legal/cgu.html` + `confidentialite.html` |
| 8 | MyMemory | IDENTIFIÉ | À traiter |
| 9 | Capacitor | ABSENT | |
| 10 | Registre bugs | PARTIEL | Ce fichier |

## Livrables de cette étape
- Pages CGU et Politique de confidentialité accessibles.
- Nouvel écran « Compte et données » depuis l’accueil parent (bouton à côté de Déconnexion).
- Export (version de démonstration) + demande de suppression avec double confirmation.

**Note :** la suppression réelle et l’export complet des données nécessiteront une Cloud Function pour être sécurisés. L’interface est prête.

---
*Rien n’a été déployé sur le site live.*
