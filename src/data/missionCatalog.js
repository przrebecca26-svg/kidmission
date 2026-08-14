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
  { id: "b18", fr: "Lire à voix haute", he:
