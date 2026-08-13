# KidMission — fondation comptes/Firebase

Ceci est la **phase 1** du chantier : comptes, connexion, sécurité, structure du projet.
L'interface complète (Bonus/Malus/Jokers/Récompenses/Versements/Réglages) de la version
Claude sera portée dans une phase 2, une fois cette base testée.

## Ce qui est prêt

- Inscription/connexion Maman (email + mot de passe)
- Création de profils enfants, avec devise personnalisable (argent / temps d'écran / points)
- Connexion enfant simplifiée (identifiant + code à 6 chiffres, pas d'email)
- Astuce technique pour que créer le compte d'un enfant ne déconnecte jamais Maman
- Schéma Firestore multi-enfants, un document par action (pas un gros blob)
- Règles de sécurité Firestore (rôles parent/enfant, accès isolé par enfant)
- Manifeste PWA + icônes, prêt pour "Ajouter à l'écran d'accueil"

## Ce qu'il reste (phase 2)

- Porter les écrans Bonus/Malus/Hebdo/Jokers/Récompenses/Versements/Réglages
- Brancher ces écrans sur `src/services/firestore.js` (déjà prêt à les recevoir)
- Écran de gestion des accès enfants (reset de code, révocation d'un ancien appareil)

## Pour toi (Rebecca) — étapes dans Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com), crée un projet.
2. **Firestore Database** → Créer une base → mode **production**.
3. **Authentication → Sign-in method** → active **Email/Password** (pas "Anonyme").
4. **Paramètres du projet (⚙️) → Général → Vos applications → Ajouter une application → Web** (icône `</>`).
   Donne-lui un nom (ex: "KidMission Web"), tu n'as pas besoin de cocher "Firebase Hosting".
   Firebase affiche un bloc de code avec `apiKey`, `authDomain`, etc. — copie ces 6 valeurs.
5. Colle-les dans un fichier `.env` (copie `.env.example` en `.env` et remplis).
6. **Firestore Database → Règles** → colle le contenu de `firestore.rules` (à la racine du projet) → Publier.

## Pour héberger — sans terminal, en 2 services gratuits (GitHub + Netlify)

**1. Mets le dossier sur GitHub (juste pour que Netlify puisse le lire)**
1. Crée un compte gratuit sur [github.com](https://github.com)
2. **New repository** → nom "kidmission" → **Create repository**
3. Sur la page du repo vide → lien "uploading an existing file" → glisse-dépose **tout le contenu** de ce dossier (sauf `node_modules` s'il existe, et sauf `.env` — Netlify gérera ça autrement, étape 3 ci-dessous)
4. **Commit changes**

**2. Connecte Netlify à ce repo**
1. Compte gratuit sur [app.netlify.com](https://app.netlify.com)
2. **Add new site → Import an existing project → Deploy with GitHub**
3. Choisis le repo "kidmission"
4. Build command : `npm run build` — Publish directory : `dist` (Netlify les devine généralement tout seul)

**3. Ajoute la config Firebase dans Netlify (pas besoin de fichier .env sur GitHub)**
Dans Netlify → **Site configuration → Environment variables → Add a variable**, ajoute ces 6 :

| Clé | Valeur |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDG75AFptXTo8r_LWXxRyQppw7kCQEun2I` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `kidmission-32eb6.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `kidmission-32eb6` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `kidmission-32eb6.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `619180892984` |
| `VITE_FIREBASE_APP_ID` | `1:619180892984:web:5a5ade6559a548c0c817cd` |

**4. Déploie**
**Deploys → Trigger deploy → Deploy site**. Après une minute, Netlify donne une URL du style `kidmission-xxxx.netlify.app`.

**5. N'oublie pas de publier les règles de sécurité dans Firebase**
Console Firebase → **Firestore Database → Règles** → colle tout le contenu de `firestore.rules` (à la racine de ce dossier) → **Publier**. Sans ça, personne ne peut ni lire ni écrire — l'app affichera des erreurs.

## Développement local (si un jour tu as quelqu'un avec Node.js)

```
npm install
npm run dev
```
