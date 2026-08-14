/**
 * Canonical catalog for Shyrel's mission system — bonus, malus, weekly bonuses,
 * jokers (earning + spending), and special rewards. Values (amounts/joker counts)
 * are exactly as defined by Rebecca; do not alter them.
 *
 * Each item is { id, fr, he, val } — val is always a positive number, the sign
 * or meaning (gain/cost) is applied by the tab it belongs to in ChildSettings.jsx.
 */

export const BONUS_CATALOG = [
  { id: "b1", fr: "Ranger sa chambre", he: "לסדר את החדר שלה", val: 20 },
  { id: "b2", fr: "Faire son lit", he: "לסדר את המיטה", val: 10 },
  { id: "b3", fr: "Mettre la table", he: "לערוך את השולחן", val: 10 },
  { id: "b4", fr: "Débarrasser la table", he: "לפנות את השולחן", val: 10 },
  { id: "b5", fr: "Vider le lave-vaisselle", he: "לרוקן את המדיח", val: 15 },
  { id: "b6", fr: "Ranger ses vêtements", he: "לסדר את הבגדים שלה", val: 15 },
  { id: "b7", fr: "Préparer son cartable seule", he: "להכין לבד את תיק בית הספר", val: 10 },
  { id: "b8", fr: "Jouer et s'occuper de Stitch quand maman le demande", he: "לשחק ולטפל בסטיץ' כשאמא מבקשת", val: 10 },
  { id: "b9", fr: "Aider à cuisiner", he: "לעזור בבישול", val: 10 },
  { id: "b10", fr: "Ranger les courses", he: "לסדר את הקניות", val: 10 },
  { id: "b11", fr: "Trier une machine de linge", he: "למיין כביסה", val: 10 },
  { id: "b12", fr: "Plier ses vêtements", he: "לקפל את הבגדים שלה", val: 20 },
  { id: "b13", fr: "Nettoyer son bureau", he: "לסדר ולנקות את שולחן הכתיבה", val: 10 },
  { id: "b14", fr: "Préparer ses affaires pour le lendemain", he: "להכין את הדברים ליום המחרת", val: 10 },
  { id: "b15", fr: "Ranger correctement ses chaussures", he: "לסדר את הנעליים במקום", val: 10 },
  { id: "b16", fr: "Nettoyer une vitre adaptée à sa taille", he: "לנקות חלון בגובה המתאים לה", val: 15 },
  { id: "b17", fr: "Lire 15 minutes", he: "לקרוא במשך 15 דקות", val: 10 },
  { id: "b18", fr: "Lire à voix haute", he: "לקרוא בקול רם", val: 15 },
  { id: "b19", fr: "Faire ses devoirs sans râler", he: "להכין שיעורים בלי להתלונן", val: 15 },
  { id: "b20", fr: "Se doucher sans rappel", he: "להתקלח בלי תזכורת", val: 10 },
  { id: "b21", fr: "Aller au lit sans discuter", he: "ללכת לישון בלי להתווכח", val: 10 },
  { id: "b22", fr: "Dire bonjour, merci ou s'il te plaît spontanément", he: "לומר שלום, תודה או בבקשה מיוזמתה", val: 5 },
  { id: "b23", fr: "Ramasser un déchet sans qu'on demande", he: "להרים לכלוך בלי שיבקשו ממנה", val: 10 },
  { id: "b24", fr: "Aider maman spontanément", he: "לעזור לאמא מיוזמתה", val: 20 },
  { id: "b25", fr: "Jouer gentiment avec un plus petit", he: "לשחק יפה עם ילד קטן יותר", val: 15 },
  { id: "b26", fr: "Bonne remarque de la maîtresse", he: "מחמאה מהמורה", val: 30 },
  { id: "b27", fr: "Dire la vérité après une bêtise", he: "לומר את האמת אחרי טעות", val: 20 },
  { id: "b28", fr: "Reconnaître son erreur seule", he: "להודות בטעות בעצמה", val: 20 },
  { id: "b29", fr: "Faire preuve de courage", he: "להפגין אומץ", val: 20 },
  { id: "b30", fr: "Faire preuve de patience", he: "להפגין סבלנות", val: 15 },
  { id: "b31", fr: "Aider une personne âgée", he: "לעזור לאדם מבוגר", val: 20 },
  { id: "b32", fr: "Défendre gentiment un camarade", he: "להגן על חבר בצורה יפה", val: 30 },
  { id: "b33", fr: "Consoler quelqu'un", he: "לנחם מישהו", val: 20 },
  { id: "b34", fr: "Aider Stitch spontanément", he: "לעזור לסטיץ' מיוזמתה", val: 20 },
  { id: "b35", fr: "Faire un câlin à maman quand elle est fatiguée", he: "לחבק את אמא כשהיא עייפה", val: 10 },
];

export const MALUS_CATALOG = [
  { id: "m1", fr: "Chaussure laissée au milieu", he: "נעל שנשארה באמצע הבית", val: 10 },
  { id: "m2", fr: "Vêtement par terre", he: "בגד על הרצפה", val: 10 },
  { id: "m3", fr: "Serviette par terre", he: "מגבת על הרצפה", val: 10 },
  { id: "m4", fr: "Jouet non rangé", he: "צעצוע שלא סודר", val: 10 },
  { id: "m5", fr: "Assiette ou verre abandonné", he: "צלחת או כוס שנשארו בחוץ", val: 10 },
  { id: "m6", fr: "Affaires laissées dans le salon (par objet)", he: "חפצים שנשארו בסלון", val: 10 },
  { id: "m7", fr: "Obligation de répéter 3 fois la même chose", he: "צריך להגיד לה 3 פעמים את אותו הדבר", val: 10 },
  { id: "m8", fr: "Faire semblant de ne pas entendre", he: "להעמיד פנים שלא שומעת", val: 15 },
  { id: "m9", fr: "Répondre impoliment", he: "לענות בחוצפה", val: 20 },
  { id: "m10", fr: "Crier ou faire une crise", he: "לצעוק או לעשות סצנה", val: 20 },
  { id: "m11", fr: "Négocier sans fin pour la douche", he: "להתווכח בלי סוף על המקלחת", val: 20 },
  { id: "m12", fr: "Dire « j'arrive » et ne pas venir", he: "להגיד \"אני באה\" ולא לבוא", val: 10 },
  { id: "m13", fr: "Oublier de tirer la chasse", he: "לשכוח להוריד מים בשירותים", val: 20 },
  { id: "m14", fr: "Chambre en désordre total", he: "חדר מבולגן לגמרי", val: 30 },
  { id: "m15", fr: "Refuser une tâche demandée", he: "לסרב לבצע משימה שהתבקשה", val: 30 },
  { id: "m16", fr: "Ne pas faire ses devoirs", he: "לא להכין שיעורי בית", val: 30 },
  { id: "m17", fr: "Mentir", he: "לשקר", val: 30 },
  { id: "m18", fr: "Cacher une bêtise", he: "להסתיר מעשה לא טוב", val: 30 },
  { id: "m19", fr: "Mot de la maîtresse ou note 0", he: "הערה מהמורה או ציון 0", val: 50 },
  { id: "m20", fr: "Travail bâclé volontairement", he: "לעשות עבודה ברשלנות בכוונה", val: 30 },
  { id: "m21", fr: "Mauvaise attitude à l'école", he: "התנהגות לא טובה בבית הספר", val: 50 },
  { id: "m22", fr: "Taper ou être méchante avec quelqu'un", he: "להרביץ או להיות רעה למישהו", val: 50 },
];

export const WEEKLY_CATALOG = [
  { id: "w1", fr: "Aucun vêtement au sol pendant 7 jours", he: "ללא בגדים על הרצפה במשך 7 ימים", val: 50 },
  { id: "w2", fr: "Aucun rappel pour la douche pendant 7 jours", he: "ללא תזכורת למקלחת במשך 7 ימים", val: 50 },
  { id: "w3", fr: "Aucun rappel pour ranger sa chambre pendant 7 jours", he: "ללא תזכורת לסידור החדר במשך 7 ימים", val: 50 },
  { id: "w4", fr: "Lit fait tous les jours pendant 1 semaine", he: "מיטה מסודרת כל יום במשך שבוע", val: 30 },
  { id: "w5", fr: "École sans remarque négative", he: "ללא הערות שליליות מבית הספר", val: 50 },
  { id: "w6", fr: "Respect des horaires toute la semaine", he: "עמידה בזמנים במשך כל השבוע", val: 100 },
  { id: "w7", fr: "Aucune dispute inutile avec maman pendant 7 jours", he: "ללא ויכוחים מיותרים עם אמא במשך 7 ימים", val: 100 },
  { id: "w8", fr: "Chambre impeccable toute la semaine", he: "חדר מסודר למופת במשך כל השבוע", val: 100 },
  { id: "w9", fr: "Mettre le linge sale au panier toute la semaine", he: "לשים את הכביסה המלוכלכת בסל במשך כל השבוע", val: 30 },
  { id: "w10", fr: "Semaine calme sans pleurnicheries excessives", he: "שבוע רגוע ללא תלונות ובכיינות מיותרת", val: 50 },
];

export const JOKER_EARN_CATALOG = [
  { id: "je1", fr: "7 jours sans aucun malus", he: "7 ימים ללא אף קנס", val: 1 },
  { id: "je2", fr: "Chambre impeccable pendant 1 semaine", he: "חדר מושלם במשך שבוע", val: 1 },
  { id: "je3", fr: "15 jours d'école sans remarque", he: "15 ימים בבית הספר ללא הערות", val: 1 },
  { id: "je4", fr: "Aider maman tous les jours pendant 1 semaine", he: "לעזור לאמא כל יום במשך שבוע", val: 1 },
  { id: "je5", fr: "Dire la vérité sur une grosse bêtise", he: "לומר את האמת על טעות גדולה", val: 1 },
  { id: "je6", fr: "Faire preuve d'un grand courage", he: "להפגין אומץ מיוחד", val: 1 },
  { id: "je7", fr: "30 bonus gagnés dans le mois", he: "לצבור 30 בונוסים בחודש", val: 1 },
  { id: "je8", fr: "Aucun objet laissé par terre pendant 2 semaines", he: "לא להשאיר חפצים על הרצפה במשך שבועיים", val: 1 },
  { id: "je9", fr: "Bulletin scolaire très positif", he: "תעודה מצוינת", val: 2 },
  { id: "je10", fr: "Mois complet sans mot de la maîtresse", he: "חודש שלם ללא הערות מהמורה", val: 2 },
];

export const JOKER_USE_CATALOG = [
  { id: "ju1", fr: "Annuler un petit malus", he: "ביטול קנס קטן", val: 1 },
  { id: "ju2", fr: "Choisir le film du soir", he: "לבחור את הסרט של הערב", val: 1 },
  { id: "ju3", fr: "30 minutes de télévision ou téléphone supplémentaires", he: "30 דקות נוספות של טלוויזיה או טלפון", val: 1 },
  { id: "ju4", fr: "Choisir le repas du soir", he: "לבחור את ארוחת הערב", val: 2 },
  { id: "ju5", fr: "Inviter une cousine", he: "להזמין בת דודה", val: 2 },
  { id: "ju6", fr: "Soirée spéciale maman-fille", he: "ערב מיוחד עם אמא", val: 3 },
  { id: "ju7", fr: "Sortie spéciale avec Stitch", he: "יציאה מיוחדת עם סטיץ'", val: 3 },
  { id: "ju8", fr: "Petit cadeau surprise", he: "מתנת הפתעה קטנה", val: 5 },
];

export const REWARD_CATALOG = [
  { id: "r1", fr: "Choisir le dessert", he: "לבחור את
