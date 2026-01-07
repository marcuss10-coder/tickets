import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EventosService } from '../eventos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {

  peliculas: any[] = [];
  todasLasPeliculas: any[] = [];
  form!: FormGroup;
  terminoBusqueda: string = '';

  editando = false;
  eventoId!: number;

  // 👇 controla el modal / formulario
  mostrarFormulario = false;

  constructor(
    private eventosService: EventosService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nameEvent: ['', Validators.required],
      descriptionEvent: [''],
      microserviceEventId: ['', Validators.required],
      venue: [''],
      dateTimeEvent: ['', Validators.required],
      capacity: [0],
      imageUrl: ['']
    });

    this.cargarPeliculas();
  }

  // 🎬 Listar solo películas
  cargarPeliculas() {
    this.eventosService.getEventos().subscribe({
      next: (res: any[]) => {
        this.peliculas = res.filter(e => e.eventType === 'cinema');
        this.todasLasPeliculas = [...this.peliculas];
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las películas', 'error');
      }
    });
  }

  // 🔍 Buscar películas
  buscarPeliculas(event: any) {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    
    if (!termino) {
      this.peliculas = [...this.todasLasPeliculas];
      return;
    }
    
    this.peliculas = this.todasLasPeliculas.filter(pelicula => 
      pelicula.nameEvent.toLowerCase().includes(termino)
    );
  }

  // ➕ Abrir formulario (Agregar)
  abrirFormulario() {
    this.form.reset();
    this.editando = false;
    this.mostrarFormulario = true;
  }

  // ❌ Cerrar formulario
  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.reset();
  }

  // 💾 Crear / actualizar película
  guardar() {
    if (this.form.invalid) {
      Swal.fire('Formulario incompleto', 'Completa los campos obligatorios', 'warning');
      return;
    }

    const payload = {
      ...this.form.value,
      eventType: 'cinema'
    };

    if (this.editando) {
      this.eventosService.actualizarEvento(this.eventoId, payload)
        .subscribe({
          next: () => {
            Swal.fire('Actualizado', 'La película fue actualizada correctamente', 'success');
            this.cerrarFormulario();
            this.cargarPeliculas();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo actualizar la película', 'error');
          }
        });

    } else {
      this.eventosService.crearEvento(payload)
        .subscribe({
          next: (response: any) => {
            Swal.fire('Película creada', 'La película se creó correctamente', 'success');
            this.cerrarFormulario();
            // Agregar la nueva película al array sin recargar
            const nuevaPelicula = { ...payload, idEvent: response.idEvent };
            this.peliculas.push(nuevaPelicula);
            this.todasLasPeliculas.push(nuevaPelicula);
          },
          error: () => {
            Swal.fire('Error', 'No se pudo crear la película', 'error');
          }
        });
    }
  }

  // ✏️ Editar
  editar(pelicula: any) {
    this.editando = true;
    this.eventoId = pelicula.idEvent;
    this.mostrarFormulario = true;

    this.form.patchValue({
      nameEvent: pelicula.nameEvent,
      descriptionEvent: pelicula.descriptionEvent,
      microserviceEventId: pelicula.microserviceEventId,
      venue: pelicula.venue,
      dateTimeEvent: pelicula.dateTimeEvent,
      capacity: pelicula.capacity,
      imageUrl: pelicula.imageUrl
    });
  }

  // 🗑️ Eliminar (cancelar evento)
  eliminar(id: number) {
    Swal.fire({
      title: '¿Eliminar película?',
      text: 'Esta acción cancelará el evento',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.eventosService.eliminarEvento(id)
          .subscribe({
            next: () => {
              Swal.fire('Eliminado', 'La película fue eliminada', 'success');
              // Eliminar la película del array sin recargar
              this.peliculas = this.peliculas.filter(p => p.idEvent !== id);
              this.todasLasPeliculas = this.todasLasPeliculas.filter(p => p.idEvent !== id);
            },
            error: () => {
              Swal.fire('Error', 'No se pudo eliminar la película', 'error');
            }
          });
      }
    });
  }

  // 🔄 Reset formulario
  reset() {
    this.editando = false;
    this.eventoId = 0;
    this.form.reset();
  }
}