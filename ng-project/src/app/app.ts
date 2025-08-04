import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  username="admin"
  name="Aui Sarun"
  age ="20"
  address = "สส"
  showAddress(){
    return "ที่อยู่ "+this.address
  }

}
