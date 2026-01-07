import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apiUrl = 'http://localhost:5000/cliente';

  constructor(private http: HttpClient) {}

  getClientes() {
    return this.http.get<any[]>(`${this.apiUrl}/lista`);
  }

  crearCliente(data: any) {
    return this.http.post(`${this.apiUrl}/crear`, data);
  }

  actualizarCliente(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, data);
  }

  eliminarCliente(id: number) {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}
