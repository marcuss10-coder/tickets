import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    NavbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend-ticket';

  constructor(public router: Router) {}

  irDashboard(event: Event) {
    event.preventDefault();
    this.router.navigate(['/dashboard']);
  }

  irClientes(event: Event) {
    event.preventDefault();
    this.router.navigate(['/clientes']);
  }

  irEventos(event: Event) {
    event.preventDefault();
    this.router.navigate(['/eventos']);
  }
}
