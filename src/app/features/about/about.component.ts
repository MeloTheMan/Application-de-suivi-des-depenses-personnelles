import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cash, save, wallet, analytics } from 'ionicons/icons';

@Component({
  selector: 'app-about',
  templateUrl: 'about.component.html', 
  styleUrls: ['about.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AboutComponent {
  constructor(){
    addIcons({save, cash, wallet, analytics});
  }
}