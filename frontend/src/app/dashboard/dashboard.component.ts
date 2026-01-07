import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private service = inject(DashboardService);
  public data: any = null;

  ngOnInit() {
    this.service.getDashboardData().subscribe((res: any) => {
      this.data = res;
    });
  }
}