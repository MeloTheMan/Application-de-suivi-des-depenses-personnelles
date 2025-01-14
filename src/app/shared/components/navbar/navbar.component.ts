import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import { card, cash, grid, settings, wallet, people } from 'ionicons/icons';
import { IonTabs, IonTabButton, IonIcon, IonLabel, IonTabBar, IonItem } from "@ionic/angular/standalone";

@Component({
  selector: 'app-navbar',
  templateUrl:'navbar.component.html' ,
  standalone: true,
  imports: [IonItem, IonTabBar, IonLabel, IonIcon, IonTabButton, IonTabs]
})
export class NavbarComponent {
  constructor(){
    addIcons({cash,card,grid,wallet,people,settings});
  }
}