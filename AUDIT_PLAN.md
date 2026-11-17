# KidMission — Plan des 10 corrections prioritaires
**Branche :** `grok-reprise`  
**Date :** 17 novembre 2026  
**Règle :** ne pas toucher à `main` ni casser l’existant.

## Statut des priorités (mis à jour)

| # | Correction | Statut | Notes |
|---|------------|--------|-------|
| 1 | Retirer clés Firebase du README | **FAIT** | |
| 2 | Audit règles + isolation | **DOCUMENTÉ** | `SECURITY_NOTES.md` |
| 3 | Branche de travail | **FAIT** | `grok-reprise` |
| 4 | Tests parcours | **PRÉPARÉ** | `TEST_PARCOURS.md` |
| 5 | Abonnements | **SQUELETTE** | `src/services/subscription.js` (modèle + helpers, pas encore IAP) |
| 6 | Suppression de compte + export | **PRÉPARÉ** | Écran `AccountSettings` |
| 7 | Pages légales | **FAIT** | `public/legal/` |
| 8 | MyMemory | IDENTIFIÉ | À traiter |
| 9 | Capacitor | ABSENT | |
| 10 | Registre bugs | PARTIEL | Ce fichier |

## Livrables récents
- Notes de sécurité (`SECURITY_NOTES.md`) : isolation confirmée, points à renforcer listés.
- Squelette d’abonnements (`subscription.js`) : plans mensuel/annuel, fonction `isFamilySubscribed` (retourne true pour l’instant afin de ne rien casser).

**Prochaine étape logique :** préparer la base Capacitor (config, icônes) sans soumettre, puis tests sur vrais appareils.

---
*Rien n’a été déployé sur le site live. Aucune famille existante n’est impactée.*
