import { Component, inject } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface DatosDialogoRechazo {
  titulo: string;
  descripcion: string;
}

const MAX_JUSTIFICACION = 500;

function noSoloEspacios(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string | null;
  return v && !v.trim() ? { soloEspacios: true } : null;
}

// Devuelve la justificación (sin espacios sobrantes) o undefined si se cancela.
@Component({
  selector: 'app-dialogo-rechazo',
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './dialogo-rechazo.html',
  styleUrl: './dialogo-rechazo.scss'
})
export class DialogoRechazo {
  datos = inject<DatosDialogoRechazo>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<DialogoRechazo, string>);

  readonly max = MAX_JUSTIFICACION;
  justificacion = new FormControl('', [Validators.required, Validators.maxLength(MAX_JUSTIFICACION), noSoloEspacios]);

  largo(): number {
    return this.justificacion.value?.length ?? 0;
  }

  confirmar(): void {
    if (this.justificacion.invalid) {
      this.justificacion.markAsTouched();
      return;
    }
    this.ref.close(this.justificacion.value!.trim());
  }
}
