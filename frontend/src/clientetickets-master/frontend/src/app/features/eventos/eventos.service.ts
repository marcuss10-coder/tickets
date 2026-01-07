import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventosService {

  // 🔗 URL base del backend
  private apiUrl = 'http://localhost:5000/events';

  constructor(private http: HttpClient) {}

  // 📌 Listar eventos
  getEventos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/eventos`);
  }

  // ➕ Crear evento (película)
  crearEvento(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/eventos`, data);
  }

  // ✏️ Editar evento
  actualizarEvento(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/eventos/${id}`, data);
  }

  // 🛑 Cancelar evento
  cancelarEvento(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/eventos/${id}/cancelar`, {});
  }

  // 🗑️ Eliminar evento (soft delete)
  eliminarEvento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eventos/${id}`);
  }

  // 🔍 Buscar eventos (opcional)
  buscarEventos(filtro: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/eventos/buscar?search=${filtro}`);
  }
}
