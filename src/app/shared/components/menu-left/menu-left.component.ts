import { Component, OnInit } from '@angular/core';
import { IonTabs, IonTabButton, IonIcon, IonLabel, IonTabBar } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { card, cash, home, save, settings, grid, information } from 'ionicons/icons';

@Component({
  selector: 'app-menu-left',
  templateUrl: './menu-left.component.html',
  styleUrls: ['./menu-left.component.scss'],
  standalone: true,
  imports: [IonTabBar, IonLabel, IonIcon, IonTabButton, IonTabs,  ]
})
export class MenuLeftComponent  implements OnInit {

  constructor(){
  }

  ngOnInit() {}

}
