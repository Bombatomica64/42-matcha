import { Component, OnInit } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-main-sidebar',
  imports: [MenuModule, BadgeModule, RippleModule, AvatarModule],
  templateUrl: './main-sidebar.html',
  styles: `
    :host {
    }
    :host ::ng-deep .p-menu {
      --p-menu-background: #ffffff00;
      height: 100%;
    }
    :host ::ng-deep .p-menu {
      --p-menu-background: #ffffff00;
      height: 100% !important;
    }
    p-menu {
      height: 100% !important;
    }
    .card {
      height: 100%;
    }
  `
})
export class MainSidebar implements OnInit {
    items: MenuItem[] | undefined;

    ngOnInit() {
        this.items = [
            {
                label: 'Browsing',
                items: [
                    {
                        label: 'Home',
                        icon: 'pi pi-plus',
                        //shortcut: '⌘+N'
                    },
                    {
                        label: 'Profiles',
                        icon: 'pi pi-search',
                        //shortcut: '⌘+S'
                    },
                    {
                        label: 'Likes',
                        icon: 'pi pi-cog',
                        //shortcut: '⌘+O' (like ricevuti)
                    },
                ]
            },
            {
                separator: true
            },
            {
                label: 'Research',
                items: [
                    {
                        label: 'Search',
                        icon: 'pi pi-cog',
                        //shortcut: '⌘+O'
                    },
                    {
                        label: 'Filters',
                        icon: 'pi pi-inbox',
                        badge: '2'
                    }
                ]
            },
            {
                separator: true
            },
            {
                label: 'Settings',
                items: [
                    {
                        label: 'History',
                        icon: 'pi pi-inbox',
                        badge: '2'
                    },
                    {
                        label: 'Logout',
                        icon: 'pi pi-sign-out',
                        //shortcut: '⌘+Q'
                    },
                    {
                        label: 'Profile',  // Nuovo elemento per il profilo
                        icon: 'pi pi-user',
                        type: 'profile'  // Proprietà per identificare il tipo
                    },
                ]
            },
            {
                separator: true
            }

        ];
    }
}
