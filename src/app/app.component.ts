
import { Component} from '@angular/core';
import { SelectOption } from '@kolkov/angular-editor';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent  {

  htmlContent:any
  sizes: SelectOption[] = [
    {
      label: 'A4',
      value: 'A4',
    },
    {
      label: 'A3',
      value: 'A3',
    },
    {
      label: 'A3',
      value: 'A3',
    },
  ];

}
