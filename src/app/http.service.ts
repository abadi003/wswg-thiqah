import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';

@Injectable()
export class HttpService{

    constructor(public httpClient: HttpClient) {

    }

    pdf(html:string){
        return this.httpClient.post<{data:string}>("http://localhost:3000" , {data:html.toString()})
    }

    createPdf(templateDto:{name:string , content:string}){
        // return this.httpClient.post("http://localhost:3000/template" , {name: })
    }
}
