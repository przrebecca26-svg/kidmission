# Préparation Capacitor — iOS & Android
**Branche :** `grok-reprise`  
**Date :** 17 novembre 2026

## État actuel
- `package.json` contient déjà les dépendances Capacitor 6 + scripts (`cap:sync`, `cap:open:ios`, etc.).
- `capacitor.config.json` est présent (appId `app.kidmission`, webDir `dist`, splash screen configuré).
- Icônes PWA déjà dans `public/icons/` (192 et 512, maskable).

## Ce qu’il reste à faire pour les stores
1. **Sur une machine avec Node + Xcode (Mac) et Android Studio** :
   ```bash
   npm install
   npm run build
   npx cap add ios
   npx cap add android
   npx cap sync
   ```
2. Générer les icônes et splash screens natifs (avec `@capacitor/assets` ou manuellement).
3. Configurer les entitlements iOS (Push, In-App Purchase) et les permissions Android.
4. Brancher un plugin IAP (ex. `@revenuecat/purchases-capacitor` ou `@capacitor-community/in-app-purchases`) pour les abonnements avec essai 7 jours.
5. Tests sur vrais appareils (iPhone + Android).
6. Préparer les fiches App Store Connect et Google Play Console (captures, descriptions, classification d’âge, etc.).

## Points importants pour Apple (apps enfants / familles)
- Apple est strict sur les apps destinées aux enfants.
- Il faudra probablement déclarer l’app comme « Made for Families » ou justifier le contenu.
- Les abonnements doivent respecter les règles Apple (essai gratuit géré par le store).
- Politique de confidentialité et suppression de compte déjà préparées côté web — à refléter dans les stores.

## Note
Aucune plateforme native (`ios/` ou `android/`) n’a été ajoutée dans le repo pour l’instant (elles sont générées localement). Le site web continue de fonctionner normalement.
