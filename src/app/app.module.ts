import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SelectComponent } from './select.component';
import { EditorService } from './editor.service';
import { ToolBarComponent } from './toolbar.component';
import { EditorComponent } from './ediror.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpService } from './http.service';
import { CreatePdfModalComponent } from './create-pdf-modal/create-pdf-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    SelectComponent,
    ToolBarComponent,
    EditorComponent,
    CreatePdfModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularEditorModule,
    FormsModule,
    HttpClientModule,
    FontAwesomeModule,
  ],
  providers: [EditorService , HttpService],
  bootstrap: [AppComponent]
})
export class AppModule { }
