import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  items = [
    {
      name: 'api reference'
    },
    {
      name: 'current conditions'
    }
  ]
}
