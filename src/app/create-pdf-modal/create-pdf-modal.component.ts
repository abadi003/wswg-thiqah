import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-create-pdf-modal',
  templateUrl: './create-pdf-modal.component.html',
  styleUrls: ['./create-pdf-modal.component.scss']
})
export class CreatePdfModalComponent implements OnInit {

  name!: string;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
