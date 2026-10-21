import { AbstractControl, ValidationErrors } from '@angular/forms';

// Mismo formato que el campo RUT de Ingreso: 12.345.678-9
export function formatearRut(valor: string): string {
  let limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length > 9) limpio = limpio.slice(0, 9);
  if (limpio.length <= 1) return limpio;
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${limpio.slice(-1)}`;
}

// Mismo cálculo (módulo 11) que TrabajadorValidator en el backend, que vuelve a validar al enviar.
export function rutValido(control: AbstractControl): ValidationErrors | null {
  const v = (control.value as string | null) ?? '';
  if (!v) return null;
  const limpio = v.replace(/[.\-\s]/g, '').toUpperCase();
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (cuerpo.length < 1 || cuerpo.length > 8 || !/^\d+$/.test(cuerpo)) return { rutInvalido: true };

  let suma = 0, multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === esperado ? null : { rutInvalido: true };
}
