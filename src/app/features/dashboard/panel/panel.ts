import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RolSimuladoService } from '../../../core/rol-simulado';

@Component({
  imports: [CommonModule],
  selector: 'app-panel',
  templateUrl: './panel.html',
  styleUrl: './panel.scss'
})
export class Panel implements OnInit {
  resumen: any = null;

  constructor(
    private http: HttpClient,
    public rolService: RolSimuladoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.http.get('http://localhost:5153/api/Dashboard/resumen').subscribe({
      next: (data) => {
        this.resumen = data;
        this.cdr.detectChanges();
      }
    });
  }
}