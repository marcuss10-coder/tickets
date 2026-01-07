// src/app/shared/services/usuario.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://localhost:5000/usuario';

  constructor(private http: HttpClient) {}

  // 🔹 Obtener usuario por ID
  obtenerUsuario(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/obtener/${id}`, {
      withCredentials: true
    });
  }

  // 🔹 Crear usuario
  crearUsuario(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, data, {
      withCredentials: true
    });
  }

  // 🔹 Actualizar usuario
  actualizarUsuario(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, data, {
      withCredentials: true
    });
  }
}
