import { Component, SimpleChanges, Input, Renderer2, ChangeDetectorRef, ViewChild, Output, EventEmitter, Inject, ElementRef, NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ServoyBaseComponent, BaseCustomObject, IValuelist, JSEvent, ServoyPublicService, EventLike } from '@servoy/public';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import { EditorConfig } from '@ckeditor/ckeditor5-core';
import DecoupledEditor from '../ckeditor/ckeditor';

@Component({
    selector: 'smartdocumenteditor-smartdocumenteditor',
    templateUrl: './smartdocumenteditor.html',
    standalone: false
})
export class SmartDocumentEditor extends ServoyBaseComponent<HTMLDivElement> {

    public Editor = DecoupledEditor;
    public shouldshow = 0;
    private getFocusWhenReady = false;
    private editorInstance: DecoupledEditor;
    private previewHTMLHTML: string;
    private previewHTMLreadOnly: boolean;

    @ViewChild('element', { static: true }) elementRef: ElementRef;

    VIEW_TYPE = {
        WEB: 'WEB',
        DOCUMENT: 'DOCUMENT'
    };

    @Input() dataProviderID: any;
    @Input() toolbarItems: Array<ToolbarItem>;
    @Input() showToolbar: boolean;
    @Input() overWriteTabForEditor: boolean;
    @Input() styleClass: string;
    @Input() editable: boolean;
    @Input() responsiveHeight: number;
    @Input() visible: boolean;
    @Input() viewType: string;
    @Input() language: string;
    @Input() showInspector: boolean;
    @Input() mentionFeeds: Array<MentionFeed>;
    @Input() editorStyleSheet: string;
    @Input() config: EditorConfigExtended;
    @Input() prePreviewData: string;
    @Input() minHeight: number;

    @Input() onActionMethodID: (e: JSEvent) => void;
    @Input() onFocusGainedMethodID: (e: JSEvent) => void;
    @Input() onFocusLostMethodID: (e: JSEvent) => void;
    @Input() onFileUploadedMethodID: () => void;
    @Input() onReady: () => void;
    @Input() onError: () => void;
    @Input() onDataChangeMethodID: () => void;

    @Output() dataProviderIDChange = new EventEmitter();

    constructor(renderer: Renderer2, cdRef: ChangeDetectorRef, @Inject(DOCUMENT) private document: Document, private servoyService: ServoyPublicService, private zone: NgZone) {
        super(renderer, cdRef);
        import('../ckeditor/ckeditor').then((module) => {
            this.Editor = module.default as typeof DecoupledEditor;
            this.shouldshow++;
            this.cdRef.detectChanges();
        });
    }

    svyOnInit() {
        super.svyOnInit();
        if (!this.config) {
            this.config = this.Editor.defaultConfig as EditorConfigExtended;
        }
        this.config.toolbar = {
            items: this.getToolbarItems()
        }

        //make sure custom toolbar items are created
        //We should always load them, else the valuelists don't get an update to show the correct values
        this.config.svyToolbarItems = this.getSvyToolbarItems();

        if (this.mentionFeeds && this.mentionFeeds.length) {
            //add placeholder mention feed
            this.config.mention = {
                feeds: this.getFeeds()
            }

            if (!this.config.hasOwnProperty('extraPlugins') || this.config.extraPlugins.indexOf(SvyMentionConverter) === -1) {
                if (this.config.hasOwnProperty('extraPlugins')) {
                    this.config.extraPlugins.push(SvyMentionConverter);
                } else {
                    this.config.extraPlugins = [SvyMentionConverter];
                }
            }
        }
        if (!this.config.autosave) {
            this.config.autosave = {
                save: editor => {
                    return new Promise(resolve => {
                        this.zone.run(() => {
                            setTimeout(() => {
                                const data = this.getEditorData();
                                // Save data
                                this.forceSaveData(data)
                                resolve(data);
                            }, 100);
                        })
                    });
                }
            }
        }

        if (this.config.language !== this.getCurrentLanguage()) {
            const userLanguage = this.getCurrentLanguage();
            console.debug('SmartDocument Editor setting language to: ' + userLanguage);
            this.config.language = userLanguage;
        }

        this.importLocale();

        // setting diffrent pagination for document view
        // default configuration is set in the ckeditor component
        if (this.viewType !== this.VIEW_TYPE.DOCUMENT) {
            // TODO change the default configuration this.config.pagination = { .... };
        }
        
        this.cdRef.detectChanges();
    }


    svyOnChanges(changes: SimpleChanges) {
        if (changes) {
            for (const property of Object.keys(changes)) {
                const change = changes[property];
                switch (property) {
                    case 'styleClass':
                        if (change.previousValue) {
                            const array = change.previousValue.trim().split(' ');
                            array.filter((element: string) => element !== '').forEach((element: string) => this.renderer.removeClass(this.getNativeElement(), element));
                        }
                        if (change.currentValue) {
                            const array = change.currentValue.trim().split(' ');
                            array.filter((element: string) => element !== '').forEach((element: string) => this.renderer.addClass(this.getNativeElement(), element));
                        }
                        break;
                    case 'viewType':
                        if (change.currentValue == 'DOCUMENT') {
                            if (!this.getNativeElement().classList.contains('ckeditor-documentview')) {
                                this.renderer.addClass(this.getNativeElement(), 'ckeditor-documentview');
                            }
                        } else {
                            this.renderer.removeClass(this.getNativeElement(), 'ckeditor-documentview');
                        }
                        break;
                    case 'editable':
                        if (this.editorInstance) {
                            if (change.currentValue) {
                                this.editorInstance.disableReadOnlyMode('readonly');
                            } else {
                                this.editorInstance.enableReadOnlyMode('readonly');
                            }
                        }
                        break;
                    case "responsiveHeight":
                        if (!this.servoyApi.isInAbsoluteLayout()) {
                            if (this.responsiveHeight) {
                                this.renderer.setStyle(this.getNativeElement(), 'height', this.responsiveHeight + 'px');
                            } else {
                                // when responsive height is 0 or undefined, use 100% of the parent container.
                                this.renderer.setStyle(this.getNativeElement(), 'height', '100%');
                            }
                        }
                        break;
                    case 'dataProviderID':
                        if (this.editorInstance && this.dataProviderID != this.editorInstance.getData()) {
                            console.info('Setting new data from broadcast')
                            this.editorInstance.setData(this.dataProviderID || '');
                        }
                        break;
                    case 'editorStyleSheet':
                        this.document.head.removeAttribute("[customSmartDocumentEditor]")

                        if (this.editorStyleSheet) {
                            let url = this.editorStyleSheet.split('?').shift();
                            let additions = this.editorStyleSheet.split('?').pop().split('&').filter((item) => {
                                return item.startsWith('clientnr');
                            });
                            if (additions.length) {
                                url += '?' + additions.join('&');
                            }

                            let head = this.document.getElementsByTagName('head')[0];
                            let cssHref = this.document.createElement('link');
                            cssHref.setAttribute("rel", "stylesheet");
                            cssHref.setAttribute("type", "text/css");
                            cssHref.setAttribute("href", url);
                            cssHref.setAttribute("customSmartDocumentEditor", "");
                            head.appendChild(cssHref);
                        }
                        break;
                    case 'showToolbar':
                        if (this.editorInstance) {
                            this.toggleToolbar();
                        }
                        break;
                    case 'config':
                        //console.debug("Configuration change detected, new config: " + JSON.stringify(this.config));
                        break;
                    case 'mentionFeeds':
                        if (this.config && this.mentionFeeds && this.mentionFeeds.length) {
                            //add placeholder mention feed
                            this.config.mention = {
                                feeds: this.getFeeds()
                            }

                            if (!this.config.hasOwnProperty('extraPlugins') || this.config.extraPlugins.indexOf(SvyMentionConverter) === -1) {
                                if (this.config.hasOwnProperty('extraPlugins')) {
                                    this.config.extraPlugins.push(SvyMentionConverter);
                                } else {
                                    this.config.extraPlugins = [SvyMentionConverter];
                                }
                            }
                        }
                        break;
                }
            }
        }
        super.svyOnChanges(changes);
    }

    ngOnDestroy() {
        if (this.editorInstance) {
            this.editorInstance.destroy().catch(error => {
                console.log(error);
            });
        }
    }

    public toggleToolbar() {
        const toolbar = this.getNativeElement().querySelector('#toolbar-container');
        if (toolbar.firstChild) {
            toolbar.removeChild(toolbar.firstChild);
        }

        if (this.showToolbar) {
            toolbar.appendChild(this.editorInstance.ui.view.toolbar.element);
            this.getNativeElement().querySelectorAll('.ck-toolbar')[0].classList.add('ck-reset_all');
        }
    }

    public onEditorReady(editor: DecoupledEditor): void {
        this.editorInstance = editor;
        this.editorInstance.setData(this.dataProviderID || '');
        const view = this.editorInstance.editing.view;
        const viewDocument = view.document;

        if (this.showInspector) {
            console.log('Attaching inspector is removed/disabled in SmartDocumentEditor starting from version 2024.12.0');
        }

        // Set a custom container for the toolbar
        if (this.showToolbar) {
            const toolbar = this.getNativeElement().querySelector('#toolbar-container');
            if (toolbar.firstChild)
                toolbar.removeChild(toolbar.firstChild);
            toolbar.appendChild(this.editorInstance.ui.view.toolbar.element);
            this.getNativeElement().querySelectorAll('.ck-toolbar')[0].classList.add('ck-reset_all');
        }

        (this.editorInstance.plugins.get('FileRepository') as any).createUploadAdapter = (loader) => {
            return new ServoyUploadAdapter(loader, this.servoyService.generateUploadUrl(this.servoyApi.getFormName(), this.name, 'onFileUploadedMethodID'), this.onFileUploadedMethodID);
        };

        // Disable the plugin so that no pagination is use are visible.
        if (this.viewType != this.VIEW_TYPE.DOCUMENT) {
            (this.editorInstance.plugins.get('Pagination') as any).isEnabled = false;
        }

        if (this.overWriteTabForEditor) {
            viewDocument.on('keydown', (evt, data) => {
                if ((data.keyCode == 9) && viewDocument.isFocused) {
                    this.editorInstance.execute('input', { text: "     " });

                    evt.stop(); // Prevent executing the default handler.
                    data.preventDefault();
                    view.scrollToTheSelection();
                }
            });
        }
        if (this.getFocusWhenReady) {
            this.getFocusWhenReady = false;
            this.editorInstance.focus();
        }
        if (this.onFocusGainedMethodID || this.onFocusLostMethodID) {
            this.editorInstance.ui.focusTracker.on('change:isFocused', (evt, data, isFocused) => {
                if (isFocused) {
                    if (this.onFocusGainedMethodID) {
                        this.onFocusGainedMethodID(this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'focusGained'));
                    }
                } else {
                    if (this.onFocusLostMethodID) {
                        this.onFocusLostMethodID(this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'focusLost'));
                    }
                    this.forceSaveData(this.getEditorData());
                }
            });
        }

        if (this.onActionMethodID) {
            this.editorInstance.listenTo(this.editorInstance.editing.view.document, 'click', (evt) => {
                if (!this.editable) {
                    this.onActionMethodID(this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'onAction'));
                }
            })
        }

        if (this.editable) {
            this.editorInstance.disableReadOnlyMode('readonly');
        } else {
            this.editorInstance.enableReadOnlyMode('readonly');
        }
        if (this.previewHTMLHTML) {
            this.executePreviewHTML(this.previewHTMLHTML, this.previewHTMLreadOnly);
            this.previewHTMLHTML = null;
        }
    }

    svyMentionRenderer(item) {
        const itemElement = document.createElement('span');
        itemElement.classList.add('svy-mention');
        itemElement.id = 'mention-id-' + item.id;
        itemElement.textContent = item.name;

        return itemElement;
    }

    getFeeds() {
        var result = [];
        //add other mentions
        if (this.mentionFeeds) {
            for (let i = 0; i < this.mentionFeeds.length; i++) {
                const feed = this.mentionFeeds[i];
                //Skip feed parsing.. if there is nothing to parse;
                if (!feed.valueList && !feed.feedItems) {
                    continue;
                }

                if (!feed.marker) {
                    console.warn('No marker provided for mention feed');
                    continue;
                }
                result.push(
                    {
                        marker: feed.marker,
                        minimumCharacters: feed.minimumCharacters || 0,
                        feed: function(queryText) {
                            if (feed.valueList) {
                                return new Promise(resolve => {
                                    const list = feed.valueList
                                        // Filter out the full list of all items to only those matching the query text.
                                        .filter((item) => {
                                            const searchString = queryText.toLowerCase();
                                            return item.displayValue.toString().toLowerCase().includes(searchString);
                                        })
                                        // Return 10 items max - needed for generic queries when the list may contain hundreds of elements.
                                        .slice(0, 10)
                                        //Map /Convert default valuelist names to matching object keys for tags
                                        .map((item) => {
                                            return {
                                                name: item.displayValue.toString(),
                                                id: feed.marker.toString() + item.displayValue.toString(),
                                                realValue: item.realValue,
                                                editable: feed.itemEditable || false
                                            }
                                        });

                                    resolve(list);
                                });
                            } else if (feed.feedItems) {

                                // Filter the feedItems matching the searchString
                                let matchedItems = feed.feedItems.filter((entry) => {
                                    const searchString = queryText.toLowerCase();
                                    return entry.displayValue.toString().toLowerCase().includes(searchString);
                                });

                                return matchedItems.map((entry) => {
                                    return {
                                        name: entry.displayValue.toString(),
                                        id: feed.marker.toString() + entry.displayValue.toString(),
                                        realValue: entry.realValue,
                                        format: entry.format || '',
                                        editable: feed.itemEditable || false
                                    }
                                })
                            } else {
                                return [];
                            }
                        },
                        itemRenderer: this.svyMentionRenderer
                    }
                )
            }
        }
        return result;
    }

    getSvyToolbarItems() {
        // Style of icon styleClass is overriden by the ck-reset class; causing issues in showing font icons. This is an known issue of CKEditor
        // https://stackoverflow.com/questions/65605215/prevent-from-being-added-ck-reset-classes-in-ckeditor-5
        if (this.toolbarItems && this.toolbarItems.length > 0) {
            return this.toolbarItems.filter((item) => {
                return item.type === 'servoyToolbarItem';
            }).map((item) => {
                return {
                    name: item.name,
                    label: item.label,
                    withText: item.withText || false,
                    isEnabled: item.isEnabled || false,
                    withTooltip: item.tooltip || null,
                    iconStyleClass: item.iconStyleClass || null,
                    ignoreReadOnly: item.ignoreReadOnly || false,
                    valueList: item.valueList,
                    onClick: item.onClick ? (buttonView, dropDownValue) => {
                        let jsevent = this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'action');
                        item.onClick(jsevent, item.name, dropDownValue || null)
                    } : null
                }
            })
        }
        return null;
    }

    getToolbarItems(): Array<string> {
        if (this.toolbarItems && this.toolbarItems.length > 0) {
            return this.toolbarItems.map((item) => {
                if (item.type === 'separator') {
                    return '|'
                } else if (item.type === 'wrappingBreakpoint') {
                    return '-'
                } else if (item.type === 'servoyToolbarItem') {
                    return item.name;
                } else {
                    return item.type;
                }
            })
        } else {
            return []
        }
    }

    getCurrentLanguage(): string {
        if (this.language) {
            return this.language;
        }
        let locale = this.servoyService.getLocale();
        if (locale) {
            if (locale.toLowerCase() == 'en-us') {
                return 'en';
            }
            return locale;
        }
        return 'en';
    }

    getEditorCSSStylesheetName(): string {
        if (this.editorStyleSheet) {
            let name = this.editorStyleSheet.split('?').shift();
            name = name.split('/').pop();
            return name;
        } else {
            return null;
        }
    }


    forceSaveData(data: string) {
        if (this.editable && this.editorInstance && !this.prePreviewData) {
            this.dataProviderID = data;
            this.dataProviderIDChange.emit(data);
        }
    }

    saveData() {
        if (this.editorInstance) {
            const data = this.getEditorData();
            this.forceSaveData(data);
            return data;
        }
        return null;
    }

    /**
     * Returns the data from the editor
     * @private
     * @returns {string}
     */
    getEditorData() {
        if (this.editorInstance) {
            return this.editorInstance.getData({ trim: 'empty' }) || '';
        }
        return ''
    }

    addInputAtCursor(input: string) {
        if (input) {
            if (!this.editable || !this.editorInstance) {
                return false;
            }
            this.editorInstance.execute('input', { text: input })
        }
        return true;
    }

    addTagAtCursor(marker: string, tag: string): boolean {
        if (tag) {
            if (!this.editable || !this.editorInstance) {
                return false;
            }

            for (let i = 0; i < this.mentionFeeds.length; i++) {
                if (this.mentionFeeds[i].marker === marker.toString()) {
                    const feed = this.mentionFeeds[i];
                    const list = (feed.valueList || feed.feedItems).filter((item) => {
                        return (item.realValue || item.displayValue).toString() == tag.toString();
                    })
                    if (list.length > 0) {
                        this.editorInstance.execute('mention', {
                            marker: marker.toString(), mention: {
                                name: list[0].displayValue.toString(),
                                id: feed.marker.toString() + list[0].displayValue.toString(),
                                realValue: list[0].realValue,
                                format: list[0]['format'] || '',
                                editable: feed.itemEditable || false
                            }
                        });
                        return true;
                    }

                }
            }
        }
        return false;
    }

    executeCommand(command: string, commandParameters: object) {
        if (this.editorInstance) {
            this.editorInstance.execute(command, commandParameters);
        }
    }


    insertImage(source: string) {
        if (this.editorInstance) {
            this.editorInstance.execute('imageInsert', { source: source });
        }
    }

    getHTMLData(withInlineCSS: boolean, filterStylesheetName: string): string {
        if (this.editorInstance) {
            let data = '<html><body><div class="ck-content" dir="ltr">' + this.getEditorData() + '</div></body></html>';
            if (withInlineCSS) {
                data = this.Editor.getInlineStyle(data, this.getCSSData(filterStylesheetName));
            }
            return data;
        }
        return null;
    }

    getCSSData(filterStylesheetName: string): string {
        if (filterStylesheetName) {
            let cssStyleSheetFilterArray = [filterStylesheetName, this.getEditorCSSStylesheetName()];
            let cssStyleSheetFilter = cssStyleSheetFilterArray.filter(value => {
                return !!value;
            })
            return this.Editor.getCssStyles(cssStyleSheetFilter);
        } else {
            return this.Editor.getCssStyles();
        }
    }

    getPrintCSSData(): string {
        return this.Editor.getPrintCSS();
    }

    private executePreviewHTML(html: string, readOnly?: boolean) {
        this.prePreviewData = this.getEditorData();
        if (!!(readOnly != undefined ? readOnly : true)) {
            this.editorInstance.enableReadOnlyMode('readonly');
        } else {
            this.editorInstance.disableReadOnlyMode('readonly');
        }

        this.editorInstance.setData(html);
    }

    public previewHTML(html: string, readOnly?: boolean) {
        if (!this.editorInstance) {
            this.previewHTMLHTML = html;
            this.previewHTMLreadOnly = readOnly;
            return;
        }
        //Force save current HTML Editor;
        this.forceSaveData(this.getEditorData());
        this.executePreviewHTML(html, readOnly);
    }

    public undoPreviewHTML(readOnly?: boolean) {
        this.editorInstance.setData(this.prePreviewData);
        this.prePreviewData = null;
        if (!!(readOnly != undefined ? readOnly : false)) {
            this.editorInstance.enableReadOnlyMode('readonly');
        } else {
            this.editorInstance.disableReadOnlyMode('readonly');
        }
    }

    isInPreviewMode(): boolean {
        return !!this.editorInstance.isReadOnly;
    }

    requestFocus() {
        if (this.editorInstance) {
            this.editorInstance.focus();
        }
        else {
            this.getFocusWhenReady = true;
        }
    }

    private importLocale() {
        var script = this.document.createElement("script");
        const index = this.document.baseURI.indexOf('/', 8);
        const context = index > 0 ? this.document.baseURI.substring(index) : '/';
        script.src = `${context}locales/smartdocumenteditor/${this.config.language.toLowerCase()}.js`;

        // append and execute script
        this.document.documentElement.firstChild.appendChild(script);
    }
}
export class EditorConfigExtended implements EditorConfig {
    toolbar?: { items: Array<string> };
    extraPlugins?: Array<any>;
    language?: string;
    autosave?: { save: (editor: DecoupledEditor) => Promise<string>; }
    svyToolbarItems?: Array<any>;
    mention?: { feeds: Array<any>; }
}
export class ToolbarItem extends BaseCustomObject {
    name: string;
    type: string;
    label: string;
    withText: boolean;
    keystroke: string;
    styleClass: string;
    isEnabled: boolean;
    withTooltip: boolean;
    tooltip: string;
    iconStyleClass: string;
    onClick: any;
    valueList: IValuelist;
    ignoreReadOnly: boolean;
}

export class MentionFeed extends BaseCustomObject {
    marker: string;
    valueList: IValuelist;
    feedItems: Array<MentionFeedItem>;
    minimumCharacters: number;
    itemEditable: boolean;
}

export class MentionFeedItem extends BaseCustomObject {
    displayValue: string;
    format: string;
    realValue: string;
}

class ServoyUploadAdapter {
    loader: any;
    xhr: XMLHttpRequest;
    reader: FileReader;
    onFileUploadedMethodID: any;
    uploadURL: string;

    constructor(loader, uploadURL, onFileUploadedMethodID) {
        // The file loader instance to use during the upload.
        this.loader = loader;
        this.onFileUploadedMethodID = onFileUploadedMethodID;
        this.uploadURL = uploadURL;
    }

    _initRequest() {
        const xhr = this.xhr = new XMLHttpRequest();
        let uploadUrl = this._getFileUploadURL();
        if (uploadUrl) {
            xhr.open('POST', uploadUrl, true);
            xhr.responseType = 'json';
        } else {
            throw Error('No onFileUploadMethod defined');
        }
    }

    // Initializes XMLHttpRequest listeners.
    _initListeners(resolve, reject, file, uniekFileId) {
        const xhr = this.xhr;
        const loader = this.loader;
        const genericErrorText = `Couldn't upload file: ${file.name}.`;

        xhr.addEventListener('error', () => reject(genericErrorText));
        xhr.addEventListener('abort', () => reject());
        xhr.addEventListener('load', () => {
            //reject so nothing happens in the editor; the image has to be inserted by the onFileUploadedMethodID
            reject();
        });

        if (xhr.upload) {
            xhr.upload.addEventListener('progress', evt => {
                if (evt.lengthComputable) {
                    loader.uploadTotal = evt.total;
                    loader.uploaded = evt.loaded;
                }
            });
        }
    }

    // Prepares the data and sends the request.
    _sendRequest(file, uniqueFileID) {
        let data = this._createFormDataUpload(file, { 'imageID': uniqueFileID })
        // Send the request.
        this.xhr.send(data);
    }

    //Create formDataUpload
    _createFormDataUpload(file, metadata) {
        let formPost = new FormData();
        let metaFields = Object.keys(metadata);
        metaFields.forEach(function(item) {
            formPost.append(item, metadata[item]);
        });
        formPost.append('upload', file, file.name);

        return formPost;
    }

    //Get servoy fileUpload url
    _getFileUploadURL() {
        if (this.onFileUploadedMethodID)
            return this.uploadURL;
        return null;
    }

    // Starts the upload process.
    upload() {
        if (!this.onFileUploadedMethodID) {
            //base64 upload
            return new Promise((resolve, reject) => {
                const reader = this.reader = new window.FileReader();

                reader.addEventListener('load', () => {
                    resolve({ default: reader.result });
                });

                reader.addEventListener('error', err => {
                    reject(err);
                });

                reader.addEventListener('abort', () => {
                    reject();
                });

                this.loader.file.then(file => {
                    reader.readAsDataURL(file);
                });
            });
        } else {
            //upload to resources/upload
            return this.loader.file.then(file => new Promise((resolve, reject) => {
                let uniqueFileID = this.uuidv4();
                this._initRequest();
                this._initListeners(resolve, reject, file, uniqueFileID);
                this._sendRequest(file, uniqueFileID);
            }));
        }
    }

    // Aborts the upload process.
    abort() {
        if (!this.onFileUploadedMethodID) {
            this.reader.abort();
        } else if (this.xhr) {
            this.xhr.abort();
        }
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

class SvyMentionConverter {
    constructor(editor: DecoupledEditor) {
        editor.conversion.for('upcast').elementToAttribute({
            view: {
                name: 'span',
                key: 'data-mention',
                classes: 'mention',
                attributes: {
                    'data-real-value': true,
                    'contenteditable': true
                }
            },
            model: {
                key: 'mention',
                value: viewItem => {
                    return editor.plugins.get('Mention').toMentionAttribute(viewItem, {
                        realValue: viewItem.getAttribute('data-real-value'),
                        format: viewItem.getAttribute('data-format'),
                        contenteditable: viewItem.getAttribute('contenteditable')
                    });
                }
            },
            converterPriority: 'high'
        });

        editor.conversion.for('downcast').attributeToElement({
            model: 'mention',
            view: (modelAttributeValue, { writer }) => {
                // Do not convert empty attributes (lack of value means no mention).
                if (!modelAttributeValue) {
                    return null;
                }

                let elementType = 'span';
                let attributes = {
                    class: 'mention svy-mention',
                    'data-mention': modelAttributeValue.id,
                    'data-real-value': (modelAttributeValue.realValue == undefined ? '' : modelAttributeValue.realValue),
                    'contenteditable': (modelAttributeValue.editable == undefined ? false : modelAttributeValue.editable),
                    'data-format': (modelAttributeValue.format || ''),
                }

                return writer.createAttributeElement(elementType, attributes, {
                    // Make mention attribute to be wrapped by other attribute elements.
                    priority: 20,
                    // Prevent merging mentions together.
                    id: modelAttributeValue.uid
                });
            },
            converterPriority: 'high'
        });
    }
}