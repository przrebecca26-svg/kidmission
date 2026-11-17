# Notes de sécurité — KidMission
**Branche :** `grok-reprise` — **Mise à jour :** 17 novembre 2026 (audit Claude)

## Faille corrigée (17/11/2026)
Avant : n'importe quel utilisateur connecté pouvait créer `families/{X}/members/{sonUid}` avec `role: "parent"`
dans **n'importe quelle famille X** dont il connaissait l'identifiant (identifiant facile à deviner : `famille-<nom>`),
et obtenait ainsi l'accès complet aux données des enfants de cette famille.

Après : la création d'un membre `parent` exige que l'appelant soit le `ownerUid` du document `families/{X}`
(fonction `isFamilyOwner`). Compatible avec `signUpParent()` qui écrit la famille avant le membre.
Règles publiées dans la console Firebase le 17/11/2026 (à confirmer par Rebecca).

## Autres changements de règles
- Règle explicite pour la recherche collection-group `members` (lecture de **son propre** membership uniquement).
- `families/{id}` : mise à jour autorisée pour un parent **uniquement** sur le champ `onboardingSeen`
  (avant, `markOnboardingSeen()` était refusé en silence). `ownerUid` ne peut jamais changer.

## Points solides
- Isolation par famille via `isActiveMember` / `isParent` / `isSelf`.
- Un enfant ne crée que des entrées `pending`, avec son uid et l'horodatage serveur.
- Un enfant ne peut pas se promouvoir parent (role/uid verrouillés).

## Restant à faire
1. **Suppression automatique du compte** : Cloud Function (plan Blaze) qui efface Auth (parent + comptes enfants) et toute l'arborescence `families/{id}`. En attendant : demande par email à contact@kidmission.app, traitée sous 30 jours.
2. **Code enfant à 6 chiffres** : 1 million de combinaisons. Envisager Firebase App Check et/ou un code plus long.
3. **Entrées enfant** : le montant (`amt`) d'une entrée `pending` est libre côté enfant ; le parent doit vérifier avant de valider.
4. **MyMemory** : textes envoyés à un tiers pour traduction (déclaré dans la politique de confidentialité).
5. **Abonnements** : contrôle des droits à ajouter une fois les achats in-app branchés.
