import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Attribute,
  ChangeDetectorRef,
  Component, ContentChild,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SecurityContext, TemplateRef,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ToolBarComponent } from '../toolbar/toolbar.component';
import { EditorService } from './editor.service';
import { HttpService } from '../services/http.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreatePdfModalComponent } from '../create-pdf-modal/create-pdf-modal.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls:['./editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true
    },
    EditorService
  ]
})
export class EditorComponent implements OnInit, ControlValueAccessor, AfterViewInit, OnDestroy {

  private onChange!: (value: string) => void;
  private onTouched!: () => void;

  modeVisual = true;
  showPlaceholder = false;
  disabled = false;
  focused = false;
  touched = false;
  changed = false;
  view:boolean =false
  htmls!:any[]

  style = {
    width:'210mm',
    height:'297mm',
    minHeight:'0mm',
    maxHeight:'1000mm',
    padding:'1in'
  }

  focusInstance: any;
  blurInstance: any;

  @Input() id = '';
  @Input() placeholder = 'Enter text here';
  @Input() tabIndex: number | null;

  @Output() html: any;

  @ViewChild('editor', { static: true })
    textArea!: ElementRef;
  @ViewChild('editorWrapper', { static: true })
    editorWrapper!: ElementRef;
  @ViewChild('editorToolbar')
    editorToolbar!: ToolBarComponent;
  @ContentChild("customButtons") customButtonsTemplateRef?: TemplateRef<any>;
  executeCommandFn = this.executeCommand.bind(this);

  @Output() viewMode = new EventEmitter<boolean>();

  /** emits `blur` event when focused out from the textarea */
    // eslint-disable-next-line @angular-eslint/no-output-native, @angular-eslint/no-output-rename
  @Output('blur') blurEvent: EventEmitter<FocusEvent> = new EventEmitter<FocusEvent>();

  /** emits `focus` event when focused in to the textarea */
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-native
  @Output('focus') focusEvent: EventEmitter<FocusEvent> = new EventEmitter<FocusEvent>();

  @HostBinding('attr.tabindex') tabindex = -1;

  @HostListener('focus')
  onFocus() {
    this.focus();
  }

  constructor(
    private r: Renderer2,
    private editorService: EditorService,
    @Inject(DOCUMENT) private doc: any,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    @Attribute('tabindex') defaultTabIndex: string,
    @Attribute('autofocus') private autoFocus: any,
    private httpService:HttpService,
    private modalService: NgbModal
  ) {
    const parsedTabIndex = Number(defaultTabIndex);
    this.tabIndex = (parsedTabIndex || parsedTabIndex === 0) ? parsedTabIndex : null;
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    setTimeout(() => {
        this.focus();
    }, 1000);
  }

  onPaste(event: ClipboardEvent){
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain');
      document.execCommand('insertHTML', false, text);
      return text;
  }

  /**
   * Executed command from editor header buttons
   * @param command string from triggerCommand
   * @param value
   */
  executeCommand(command: string, value?: string) {
    this.focus();
    if (command === 'focus') {
      return;
    }
    if (command === 'toggleEditorMode') {
      this.toggleEditorMode(this.modeVisual);
    } else if (command !== '') {
      if (command === 'clear') {
        this.onContentChange(this.textArea.nativeElement);
      } else if (command === 'default') {
        this.editorService.removeSelectedElements('h1,h2,h3,h4,h5,h6,p,pre');
        this.onContentChange(this.textArea.nativeElement);
      }
      else {
        this.editorService.executeCommand(command, value);
      }
      switch (command) {
        case "pageSize":
          this.setPageSize(this.editorService.getPageSize())
          break;
          case "margin":
            this.setMargin(this.editorService.getMargin())
            break;
          case "pdf":
            this.printPdf()
            break;
          case "save":
            this.createTemplate()
            break
          case "getTemplates":
            this.getTemplates()
            break;
          case "edit":
            this.edit()
            break
            default:
              break;
            }
        this.exec();
      }
    }

  /**
   * focus event
   */
  onTextAreaFocus(event: FocusEvent): void {
    if (this.focused) {
      event.stopPropagation();
      return;
    }
    this.focused = true;
    this.focusEvent.emit(event);
    if (!this.touched || !this.changed) {
      this.editorService.executeInNextQueueIteration(() => {
        this.touched = true;
      });
    }
  }

  /**
   * @description fires when cursor leaves textarea
   */
  public onTextAreaMouseOut(event: MouseEvent): void {
    this.editorService.saveSelection();
  }

  /**
   * blur event
   */
  onTextAreaBlur(event: FocusEvent) {
    /**
     * save selection if focussed out
     */
    this.editorService.executeInNextQueueIteration(this.editorService.saveSelection);

    if (typeof this.onTouched === 'function') {
      this.onTouched();
    }

    if (event.relatedTarget !== null) {
      const parent = (event.relatedTarget as HTMLElement).parentElement;
      if (!parent!.classList.contains('angular-editor-toolbar-set') && !parent!.classList.contains('ae-picker')) {
        this.blurEvent.emit(event);
        this.focused = false;
      }
    }
  }

  /**
   *  focus the text area when the editor is focused
   */
  focus() {
    if (this.modeVisual) {
      this.textArea?.nativeElement.focus();
    } else {
      const sourceText = this.doc.getElementById('sourceText' + this.id);
      sourceText.focus();
      this.focused = true;
    }
  }

  /**
   * Executed from the contenteditable section while the input property changes
   * @param element html element from contenteditable
   */
  onContentChange(element: any): void {
    let html = '';
    if (this.modeVisual) {
      html = element.innerHTML;
    } else {
      html = element.innerText;
    }
    if ((!html || html === '<br>')) {
      html = '';
    }
    if (typeof this.onChange === 'function') {
      this.onChange(html);
      if ((!html) !== this.showPlaceholder) {
        this.togglePlaceholder(this.showPlaceholder);
      }
    }
    this.changed = true;
  }

  /**
   * Set the function to be called
   * when the control receives a change event.
   *
   * @param fn a function
   */
  registerOnChange(fn: any): void {
    this.onChange = e => (e === '<br>' ? fn('') : fn(e)) ;
  }

  /**
   * Set the function to be called
   * when the control receives a touch event.
   *
   * @param fn a function
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Write a new value to the element.
   *
   * @param value value to be executed when there is a change in contenteditable
   */
  writeValue(value: any): void {

    if ((!value || value === '<br>' || value === '') !== this.showPlaceholder) {
      this.togglePlaceholder(this.showPlaceholder);
    }

    if (value === undefined || value === '' || value === '<br>') {
      value = null;
    }

    this.refreshView(value);
  }

  /**
   * refresh view/HTML of the editor
   *
   * @param value html string from the editor
   */
  refreshView(value: string): void {
    const normalizedValue = value === null ? '' : value;
    this.r.setProperty(this.textArea.nativeElement, 'innerHTML', normalizedValue);

    return;
  }

  /**
   * toggles placeholder based on input string
   *
   * @param value A HTML string from the editor
   */
  togglePlaceholder(value: boolean): void {
    if (!value) {
      this.r.addClass(this.editorWrapper.nativeElement, 'show-placeholder');
      this.showPlaceholder = true;

    } else {
      this.r.removeClass(this.editorWrapper.nativeElement, 'show-placeholder');
      this.showPlaceholder = false;
    }
  }

  /**
   * Implements disabled state for this element
   *
   * @param isDisabled Disabled flag
   */
  setDisabledState(isDisabled: boolean): void {
    const div = this.textArea.nativeElement;
    const action = isDisabled ? 'addClass' : 'removeClass';
    this.r[action](div, 'disabled');
    this.disabled = isDisabled;
  }

  /**
   * toggles editor mode based on bToSource bool
   *
   * @param bToSource A boolean value from the editor
   */
  toggleEditorMode(bToSource: boolean) {
    let oContent: any;
    const editableElement = this.textArea.nativeElement;

    if (bToSource) {
      oContent = this.r.createText(editableElement.innerHTML);
      this.r.setProperty(editableElement, 'innerHTML', '');
      this.r.setProperty(editableElement, 'contentEditable', false);

      const oPre = this.r.createElement('pre');
      this.r.setStyle(oPre, 'margin', '0');
      this.r.setStyle(oPre, 'outline', 'none');

      const oCode = this.r.createElement('code');
      this.r.setProperty(oCode, 'id', 'sourceText' + this.id);
      this.r.setStyle(oCode, 'display', 'block');
      this.r.setStyle(oCode, 'white-space', 'pre-wrap');
      this.r.setStyle(oCode, 'word-break', 'keep-all');
      this.r.setStyle(oCode, 'outline', 'none');
      this.r.setStyle(oCode, 'margin', '0');
      this.r.setStyle(oCode, 'background-color', '#fff5b9');
      this.r.setProperty(oCode, 'contentEditable', true);
      this.r.appendChild(oCode, oContent);
      this.focusInstance = this.r.listen(oCode, 'focus', (event) => this.onTextAreaFocus(event));
      this.blurInstance = this.r.listen(oCode, 'blur', (event) => this.onTextAreaBlur(event));
      this.r.appendChild(oPre, oCode);
      this.r.appendChild(editableElement, oPre);

      // ToDo move to service
      this.doc.execCommand('defaultParagraphSeparator', false, 'div');

      this.modeVisual = false;
      this.viewMode.emit(false);
      oCode.focus();
    } else {
      if (this.doc.querySelectorAll) {
        this.r.setProperty(editableElement, 'innerHTML', editableElement.innerText);
      } else {
        oContent = this.doc.createRange();
        oContent.selectNodeContents(editableElement.firstChild);
        this.r.setProperty(editableElement, 'innerHTML', oContent.toString());
      }
      this.r.setProperty(editableElement, 'contentEditable', true);
      this.modeVisual = true;
      this.viewMode.emit(true);
      this.onContentChange(editableElement);
      editableElement.focus();
    }
    this.editorToolbar.setEditorMode(!this.modeVisual);
  }

  /**
   * toggles editor buttons when cursor moved or positioning
   *
   * Send a node array from the contentEditable of the editor
   */
  exec() {
    this.editorToolbar.triggerButtons();
    let userSelection;
    if (this.doc.getSelection) {
      //#TODO
      if(this.doc.getSelection().anchorNode.textContent){
        if(this.doc.getSelection().anchorNode.textContent[0].match("^[\u0621-\u064A0-9 ]+$")){
          console.log(this.doc.getSelection().anchorNode.parentNode)
          this.doc.getSelection().anchorNode.parentNode.dir= 'rtl'
        }
        else{
          this.doc.getSelection().anchorNode.parentNode.dir= 'ltr'
        }
      }
      userSelection = this.doc.getSelection();
      this.editorService.executeInNextQueueIteration(this.editorService.saveSelection);
    }
    let a = userSelection.focusNode;
    const els = [];
    while (a && a.id !== 'editor') {
      els.unshift(a);
      a = a.parentNode;
    }
    this.editorToolbar.triggerBlocks(els);

  }

  getFonts() {
    return this.editorToolbar.fonts.map(x => {
      return {label: x.label, value: x.value};
    });
  }

//   getCustomTags() {
//     const tags = ['span'];
//     this.config.customClasses.forEach(x => {
//       if (x.tag !== undefined) {
//         if (!tags.includes(x.tag)) {
//           tags.push(x.tag);
//         }
//       }
//     });
//     return tags.join(',');
//   }

  ngOnDestroy() {
    if (this.blurInstance) {
      this.blurInstance();
    }
    if (this.focusInstance) {
      this.focusInstance();
    }
  }

  filterStyles(html: string): string {
    html = html.replace('position: fixed;', '');
    return html;
  }

  setPageSize(value:string){
    switch (value) {
      case "A4":
          this.style.width = '210mm'
          this.style.height = '297mm'
          break;
      case "A3":
        this.style.width = '297mm'
        this.style.height = '420mm'
          break;
      case "A5":
        this.style.width = '148mm'
        this.style.height = '210mm'
          break;

      default:
          this.editorService.executeCommand("pageSize", value);
          break;

  }
  }

  setMargin(value:string){
    switch (value) {
      case "normal":
          this.style.padding = '1in'
          break;
      case "narrow":
        this.style.padding = '0.5in'
          break;
      case "wide":
        this.style.padding = '1in 2in'
          break;

      default:
          this.editorService.executeCommand("pageSize", value);
          break;

  }
  }

  printPdf(){
    let DATA: HTMLElement  = document.getElementById('editor')!;
    this.httpService.pdf(DATA.outerHTML).subscribe(observer=> {
      const blob = this.base64toBlob(observer.data , 'application/pdf')
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `your-file-name.pdf`
      link.click()
    })
  }

  base64toBlob(base64Data: string, contentType = '') {
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; sliceIndex += 1) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);

      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; i += 1, offset += 1) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }

      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  createTemplate(){
    this.open().then(name => {
      this.httpService.createPdf({
        name:name,
        content:document.getElementById('editor')!.outerHTML,
        projectId:1
      }).subscribe()
    })
  }

  open() {
		return this.modalService.open(CreatePdfModalComponent , {centered: true}).result;
	}

  getTemplates(){
    this.httpService.getTemplates().subscribe(template =>{
      this.htmls=template
      this.view = true
    })
  }

  edit(){
    this.view = false
  }

}
