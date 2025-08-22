// utils/calc.js
// Utilidades pequeñas de formato / UI

/**
 * Pone en mayúscula la primera letra de una cadena.
 * Mantiene el resto tal cual viene (no hace title-case).
 */
export function ucFirst(str) {
  if (!str) return "";
  return str.charAt(0).toLocaleUpperCase() + str.slice(1);
}

/**
 * (Opcional) Title-case simple por si lo necesitamos en el futuro.
 */
export function toTitleCase(str) {
  if (!str) return "";
  return String(str)
    .split(" ")
    .map(w => (w ? w[0].toLocaleUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}
