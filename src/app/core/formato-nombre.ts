const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);

export function formatearNombre(valor: string): string {
  let primera = true;
  const resultado = valor.toLowerCase().replace(/\S+/g, (palabra) => {
    const esPrimera = primera;
    primera = false;
    if (!esPrimera && PARTICULAS.has(palabra)) return palabra;
    return palabra.charAt(0).toUpperCase() + palabra.slice(1);
  });
  return resultado.replace(/(['\-])(\p{L})/gu, (_, signo, letra) => signo + letra.toUpperCase());
}