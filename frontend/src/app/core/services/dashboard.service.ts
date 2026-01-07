import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getDashboardData() {
    return of({
      totalClients: 150,
      activeEvents: 12,
      upcomingThisWeek: 5,
      activeProducts: 45,
      recentEvents: [{ name: 'Cine: Avatar 2' }, { name: 'Concierto Rock' }],
      newClients: [{ name: 'Juan Pérez' }, { name: 'María García' }]
    });
  }
}