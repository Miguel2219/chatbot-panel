import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver } from '@angular/cdk/layout';

import { AuthService } from '../../../../core/services/auth.service';
import { StorageService } from '../../../../core/services/storage.service';
import { LoadingOverlayComponent } from '../../../../shared/layouts/loading-overlay/loading-overlay.component';
import {ModulePermissions} from '../../../auth/interfaces/auth.interface';

@Component({
  selector: 'app-main-administration',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, MatIconModule, LoadingOverlayComponent],
  templateUrl: './main-administration.component.html',
})
export class MainAdministrationComponent implements OnInit {

  navItems: ModulePermissions[] = []
  sidebarOpen = false;
  isSmallScreen = false;
  userName = '';
  userInitials = '';
  userEmail = '';

  constructor(
    private _auth: AuthService,
    private _storage: StorageService,
    private _router: Router,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit(): void {
    this.getModules();
    this.loadUserInfo();
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.isSmallScreen = result.matches;
      if (!result.matches) this.sidebarOpen = false;
    });
  }

  private loadUserInfo(): void {
    const user = this._auth.getUser();
    if (user) {
      this.userName = user.name ?? 'Usuario';
      this.userEmail = user.email ?? '';
      this.userInitials = this.getInitials(this.userName);
    }
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  private getModules(): ModulePermissions[] {
    this.navItems = this._storage.getItem('modules')
    return this.navItems;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    if (this.isSmallScreen) this.sidebarOpen = false;
  }

  logout(): void {
    this._auth.logout();
  }

  getCurrentPageTitle(): string {
    const url = this._router.url;
    const item = this.navItems.find(n => url.includes(n.route));
    return item?.name ?? 'Panel';
  }
}
