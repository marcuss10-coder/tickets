import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../profile.service'; // ajusta la ruta si tu carpeta cambia

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  usuario: any = null;
  rolesTexto: string = '';   // Para mostrar roles como string
  cargando: boolean = true;
  error: string | null = null;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    const usuarioId = 1; // ID temporal

    this.usuarioService.obtenerUsuario(usuarioId).subscribe({
      next: (resp: any) => {
        this.cargando = false; // marcamos que la carga terminó

        if (resp) {
          this.usuario = resp;

          // Convertimos roles a string para el HTML
          this.rolesTexto = this.usuario.roles?.length
            ? this.usuario.roles.map((r: any) => r.nameRole).join(', ')
            : 'Sin roles asignados';

        } else {
          // Si no hay usuario, se muestra el mensaje de error
          this.error = 'No se encontraron datos del usuario';
          this.usuario = null;
        }
      },
      error: (err) => {
        console.error('Error al cargar usuario ❌', err);
        this.cargando = false;
        this.error = 'Error al conectar con el servidor';
        this.usuario = null;
      }
    });
  }
}
