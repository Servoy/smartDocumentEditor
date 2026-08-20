import { Component, SimpleChanges, input, output, inject, ChangeDetectionStrategy, DOCUMENT, NgZone } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ServoyBaseComponent, BaseCustomObject, IValuelist, JSEvent, ServoyPublicService, EventLike } from '@servoy/public';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { EditorConfig } from '@ckeditor/ckeditor5-core';
import DecoupledEditor from '../assets/lib/ckeditor';

@Component({
    selector: 'smartdocumenteditor-smartdocumenteditor',
    templateUrl: './smartdocumenteditor.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgStyle, CKEditorModule]
})
export class SmartDocumentEditor extends ServoyBaseComponent<HTMLDivElement> {

    public Editor = DecoupledEditor;
    public shouldshow = 0;
    public configChanging = false;
    private getFocusWhenReady = false;
    private editorInstance!: DecoupledEditor;
    private previewHTMLHTML!: string;
    private previewHTMLreadOnly!: boolean;
    private _prePreviewData!: string;
    _cfg!: EditorConfigExtended;

    private readonly document = inject<Document>(DOCUMENT);
    private readonly servoyService = inject(ServoyPublicService);
    private readonly zone = inject(NgZone);

    VIEW_TYPE = {
        WEB: 'WEB',
        DOCUMENT: 'DOCUMENT'
    };

    readonly dataProviderID = input<any>(undefined as any);
    readonly toolbarItems = input<Array<ToolbarItem>>(undefined as any);
    readonly showToolbar = input<boolean>(undefined as any);
    readonly overWriteTabForEditor = input<boolean>(undefined as any);
    readonly styleClass = input<string>(undefined as any);
    readonly editable = input<boolean>(undefined as any);
    readonly responsiveHeight = input<number>(undefined as any);
    readonly visible = input<boolean>(undefined as any);
    readonly viewType = input<string>(undefined as any);
    readonly language = input<string>(undefined as any);
    readonly showInspector = input<boolean>(undefined as any);
    readonly mentionFeeds = input<Array<MentionFeed>>(undefined as any);
    readonly editorStyleSheet = input<string>(undefined as any);
    readonly config = input<EditorConfigExtended>(undefined as any);
    readonly prePreviewData = input<string>(undefined as any);
    readonly minHeight = input<number>(undefined as any);

    readonly onActionMethodID = input<(e: JSEvent) => void>(undefined as any);
    readonly onFocusGainedMethodID = input<(e: JSEvent) => void>(undefined as any);
    readonly onFocusLostMethodID = input<(e: JSEvent) => void>(undefined as any);
    readonly onFileUploadedMethodID = input<() => void>(undefined as any);
    readonly onReady = input<() => void>(undefined as any);
    readonly onError = input<() => void>(undefined as any);
    readonly onDataChangeMethodID = input<() => void>(undefined as any);

    readonly dataProviderIDChange = output<any>();

    constructor() {
        super();
        import('../assets/lib/ckeditor').then((module) => {
            this.Editor = module.default as typeof DecoupledEditor;
            this.shouldshow++;
            this.detectChanges();
        });
    }

    svyOnInit() {
        super.svyOnInit();
        let cfg = this.config();
        if (!cfg) {
            cfg = this.Editor.defaultConfig as EditorConfigExtended;
        }
        this._cfg = cfg;
        cfg.toolbar = {
            items: this.getToolbarItems()
        }
        cfg.codeBlock = {
            languages: [
                { language: 'plaintext', label: 'Plain text' , class: '' },
                { language: 'css', label: 'CSS' , class: 'css' },
                { language: 'html', label: 'HTML' , class: 'html' },
                { language: 'java', label: 'Java' , class: 'java' },
                { language: 'javascript', label: 'JavaScript', class: 'javascript' },
                { language: 'typescript', label: 'TypeScript' , class: 'typescript' },
                { language: 'xml', label: 'XML' , class: 'xml' },
                { language: 'sql', label: 'SQL' , class: 'sql' }
            ]
        }

        cfg.svyToolbarItems = this.getSvyToolbarItems() || undefined;

        if (this.mentionFeeds() && this.mentionFeeds().length) {
            cfg.mention = {
                feeds: this.getFeeds()
            }

            if (!cfg.hasOwnProperty('extraPlugins') || cfg.extraPlugins!.indexOf(SvyMentionConverter) === -1) {
                if (cfg.hasOwnProperty('extraPlugins')) {
                    cfg.extraPlugins!.push(SvyMentionConverter);
                } else {
                    cfg.extraPlugins = [SvyMentionConverter];
                }
            }
        }

        cfg.autosave = {
            save: (_editor: any) => {
                return new Promise<string>(resolve => {
                    this.zone.run(() => {
                        setTimeout(() => {
                            const data = this.getEditorData();
                            this.forceSaveData(data)
                            resolve(data);
                        }, 100);
                    })
                });
            }
        }

        if (cfg.language !== this.getCurrentLanguage()) {
            const userLanguage = this.getCurrentLanguage();
            console.debug('SmartDocument Editor setting language to: ' + userLanguage);
            cfg.language = userLanguage;
        }

        this.importLocale();

        if (this.viewType() !== this.VIEW_TYPE.DOCUMENT) {
        }
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
                    case 'responsiveHeight':
                        if (!this.servoyApi().isInAbsoluteLayout()) {
                            if (this.responsiveHeight()) {
                                this.renderer.setStyle(this.getNativeElement(), 'height', this.responsiveHeight() + 'px');
                            } else {
                                this.renderer.setStyle(this.getNativeElement(), 'height', '100%');
                            }
                        }
                        break;
                    case 'dataProviderID':
                        if (this.editorInstance && this.dataProviderID() != this.editorInstance.getData()) {
                            console.info('Setting new data from broadcast')
                            this.editorInstance.setData(this.dataProviderID() || '');
                        }
                        break;
                    case 'editorStyleSheet':
                        this.document.head.removeAttribute('[customSmartDocumentEditor]')

                        if (this.editorStyleSheet()) {
                            let url = this.editorStyleSheet().split('?').shift();
                            const additions = this.editorStyleSheet().split('?').pop()!.split('&').filter((item: string) => {
                                return item.startsWith('clientnr');
                            });
                            if (additions.length) {
                                url += '?' + additions.join('&');
                            }

                            const head = this.document.getElementsByTagName('head')[0];
                            const cssHref = this.document.createElement('link');
                            cssHref.setAttribute('rel', 'stylesheet');
                            cssHref.setAttribute('type', 'text/css');
                            cssHref.setAttribute('href', url!);
                            cssHref.setAttribute('customSmartDocumentEditor', '');
                            head.appendChild(cssHref);
                        }
                        break;
                    case 'showToolbar':
                        if (this.editorInstance) {
                            this.toggleToolbar();
                        }
                        break;
                    case 'config':
                        this.refresh();
                        break;
                    case 'mentionFeeds':
                        if (this.config() && this.mentionFeeds() && this.mentionFeeds().length) {
                            const cfg = this.config();
                            cfg.mention = {
                                feeds: this.getFeeds()
                            }

                            if (!cfg.hasOwnProperty('extraPlugins') || cfg.extraPlugins!.indexOf(SvyMentionConverter) === -1) {
                                if (cfg.hasOwnProperty('extraPlugins')) {
                                    cfg.extraPlugins!.push(SvyMentionConverter);
                                } else {
                                    cfg.extraPlugins = [SvyMentionConverter];
                                }
                            }
                            this.refresh();
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

    refresh() {
        this.configChanging = true;
        this.detectChanges();
        this.configChanging = false;
    }

    public toggleToolbar() {
        const toolbar = this.getNativeElement().querySelector('#toolbar-container');
        if (toolbar!.firstChild) {
            toolbar!.removeChild(toolbar!.firstChild);
        }

        if (this.showToolbar()) {
            toolbar!.appendChild(this.editorInstance.ui.view.toolbar.element!);
            this.getNativeElement().querySelectorAll('.ck-toolbar')[0].classList.add('ck-reset_all');
        }
    }

    public onEditorReady(editor: DecoupledEditor): void {
        this.editorInstance = editor;
        this.editorInstance.setData(this.dataProviderID() || '');
        const view = this.editorInstance.editing.view;
        const viewDocument = view.document;

        if (this.showInspector()) {
            console.log('Attaching inspector is removed/disabled in SmartDocumentEditor starting from version 2024.12.0');
        }

        if (this.showToolbar()) {
            const toolbar = this.getNativeElement().querySelector('#toolbar-container');
            if (toolbar!.firstChild)
                toolbar!.removeChild(toolbar!.firstChild);
            toolbar!.appendChild(this.editorInstance.ui.view.toolbar.element!);
            this.getNativeElement().querySelectorAll('.ck-toolbar')[0].classList.add('ck-reset_all');
        }

        (this.editorInstance.plugins.get('FileRepository') as any).createUploadAdapter = (loader: any) => {
            return new ServoyUploadAdapter(loader, this.servoyService.generateUploadUrl(this.servoyApi().getFormName(), this.name(), 'onFileUploadedMethodID'), this.onFileUploadedMethodID());
        };

        if (this.viewType() != this.VIEW_TYPE.DOCUMENT) {
            (this.editorInstance.plugins.get('Pagination') as any).isEnabled = false;
        }

        if (this.overWriteTabForEditor()) {
            viewDocument.on('keydown', (evt: any, data: any) => {
                if ((data.keyCode == 9) && viewDocument.isFocused) {
                    this.editorInstance.execute('input', { text: '     ' });

                    evt.stop();
                    data.preventDefault();
                    view.scrollToTheSelection();
                }
            });
        }
        if (this.getFocusWhenReady) {
            this.getFocusWhenReady = false;
            this.editorInstance.focus();
        }
        if (this.onFocusGainedMethodID() || this.onFocusLostMethodID()) {
            this.editorInstance.ui.focusTracker.on('change:isFocused', (_evt: any, _data: any, isFocused: boolean) => {
                if (isFocused) {
                    if (this.onFocusGainedMethodID()) {
                        this.onFocusGainedMethodID()(this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'focusGained'));
                    }
                } else {
                    if (this.onFocusLostMethodID()) {
                        this.onFocusLostMethodID()(this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'focusLost'));
                    }
                    this.forceSaveData(this.getEditorData());
                }
            });
        }

        if (this.onActionMethodID()) {
            this.editorInstance.listenTo(this.editorInstance.editing.view.document, 'click', (_evt: any) => {
                if (!this.editable()) {
                    this.onActionMethodID()(this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'onAction'));
                }
            })
        }

        if (this.editable()) {
            this.editorInstance.disableReadOnlyMode('readonly');
        } else {
            this.editorInstance.enableReadOnlyMode('readonly');
        }
        if (this.previewHTMLHTML) {
            this.executePreviewHTML(this.previewHTMLHTML, this.previewHTMLreadOnly);
            this.previewHTMLHTML = null!;
        }
    }

    svyMentionRenderer(item: any) {
        const itemElement = document.createElement('span');
        itemElement.classList.add('svy-mention');
        itemElement.id = 'mention-id-' + item.id;
        itemElement.textContent = item.name;

        return itemElement;
    }

    getFeeds() {
        const result: any[] = [];
        if (this.mentionFeeds()) {
            for (let i = 0; i < this.mentionFeeds().length; i++) {
                const feed = this.mentionFeeds()[i];
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
                        feed: function(queryText: any) {
                            if (feed.valueList) {
                                return new Promise(resolve => {
                                    const list = feed.valueList
                                        .filter((item: any) => {
                                            const searchString = queryText.toLowerCase();
                                            return item.displayValue.toString().toLowerCase().includes(searchString);
                                        })
                                        .slice(0, 10)
                                        .map((item: any) => {
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
                                const matchedItems = feed.feedItems.filter((entry: any) => {
                                    const searchString = queryText.toLowerCase();
                                    return entry.displayValue.toString().toLowerCase().includes(searchString);
                                });

                                return matchedItems.map((entry: any) => {
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
        if (this.toolbarItems() && this.toolbarItems().length > 0) {
            return this.toolbarItems().filter((item) => {
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
                    onClick: item.onClick ? (buttonView: any, dropDownValue: any) => {
                        const jsevent = this.servoyService.createJSEvent({ target: this.getNativeElement() } as EventLike, 'action');
                        item.onClick(jsevent, item.name, dropDownValue || null)
                    } : null
                }
            })
        }
        return null;
    }

    getToolbarItems(): Array<string> {
        if (this.toolbarItems() && this.toolbarItems().length > 0) {
            return this.toolbarItems().map((item) => {
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
        if (this.language()) {
            return this.language();
        }
        let locale = this.servoyService.getLocale();
        if (locale) {
            if (locale.toLowerCase() == 'en-us') {
                return 'en';
            }
            if(!['zh-cn', 'sr-latn', 'pt-br', 'en-gb', 'en-au', 'de-ch'].includes(locale.toLowerCase())) {
                locale = locale.split('-')[0].toLowerCase();
            }

            return locale;
        }
        return 'en';
    }

    getEditorCSSStylesheetName(): string | null {
        if (this.editorStyleSheet()) {
            let name = this.editorStyleSheet().split('?').shift()!;
            name = name.split('/').pop()!;
            return name;
        } else {
            return null;
        }
    }


    forceSaveData(data: string) {
        if (this.editable() && this.editorInstance && !this._prePreviewData) {
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

    getEditorData() {
        if (this.editorInstance) {
            return this.editorInstance.getData({ trim: 'empty' }) || '';
        }
        return ''
    }

    addInputAtCursor(input: string) {
        if (input) {
            if (!this.editable() || !this.editorInstance) {
                return false;
            }
            this.editorInstance.execute('input', { text: input })
        }
        return true;
    }

    addTagAtCursor(marker: string, tag: string): boolean {
        if (tag) {
            if (!this.editable() || !this.editorInstance) {
                return false;
            }

            for (let i = 0; i < this.mentionFeeds().length; i++) {
                if (this.mentionFeeds()[i].marker === marker.toString()) {
                    const feed = this.mentionFeeds()[i];
                    const list = (feed.valueList || feed.feedItems).filter((item: any) => {
                        return (item.realValue || item.displayValue).toString() == tag.toString();
                    })
                    if (list.length > 0) {
                        this.editorInstance.execute('mention', {
                            marker: marker.toString(), mention: {
                                name: list[0].displayValue.toString(),
                                id: feed.marker.toString() + list[0].displayValue.toString(),
                                realValue: list[0].realValue,
                                format: (list[0] as any)['format'] || '',
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

    getHTMLData(withInlineCSS: boolean, filterStylesheetName: string): string | null {
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
            const cssStyleSheetFilterArray = [filterStylesheetName, this.getEditorCSSStylesheetName()];
            const cssStyleSheetFilter = cssStyleSheetFilterArray.filter((value): value is string => {
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
        this._prePreviewData = this.getEditorData();
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
            this.previewHTMLreadOnly = readOnly!;
            return;
        }
        this.forceSaveData(this.getEditorData());
        this.executePreviewHTML(html, readOnly);
    }

    public undoPreviewHTML(readOnly?: boolean) {
        this.editorInstance.setData(this._prePreviewData);
        this._prePreviewData = null!;
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
        const cfg = this._cfg || this.config();
        if (!cfg || !cfg.language) {
            return;
        }
        const script = this.document.createElement('script');
        const index = this.document.baseURI.indexOf('/', 8);
        const context = index > 0 ? this.document.baseURI.substring(index) : '/';
        script.src = `${context}locales/smartdocumenteditor/${cfg.language.toLowerCase()}.js`;

        this.document.documentElement.firstChild!.appendChild(script);
    }
}
export class EditorConfigExtended implements EditorConfig {
    toolbar?: { items: Array<string> };
    extraPlugins?: Array<any>;
    language?: string;
    autosave?: any;
    svyToolbarItems?: Array<any>;
    mention?: { feeds: Array<any>; }
    codeBlock?: { languages: Array<{ language: string, label: string, class: string }> };
    [key: string]: any;
}
export class ToolbarItem extends BaseCustomObject {
    name!: string;
    type!: string;
    label!: string;
    withText!: boolean;
    keystroke!: string;
    styleClass!: string;
    isEnabled!: boolean;
    withTooltip!: boolean;
    tooltip!: string;
    iconStyleClass!: string;
    onClick: any;
    valueList!: IValuelist;
    ignoreReadOnly!: boolean;
}

export class MentionFeed extends BaseCustomObject {
    marker!: string;
    valueList!: IValuelist;
    feedItems!: Array<MentionFeedItem>;
    minimumCharacters!: number;
    itemEditable!: boolean;
}

export class MentionFeedItem extends BaseCustomObject {
    displayValue!: string;
    format!: string;
    realValue!: string;
}

class ServoyUploadAdapter {
    loader: any;
    xhr!: XMLHttpRequest;
    reader!: FileReader;
    onFileUploadedMethodID: any;
    uploadURL: string;

    constructor(loader: any, uploadURL: any, onFileUploadedMethodID: any) {
        this.loader = loader;
        this.onFileUploadedMethodID = onFileUploadedMethodID;
        this.uploadURL = uploadURL;
    }

    _initRequest() {
        const xhr = this.xhr = new XMLHttpRequest();
        const uploadUrl = this._getFileUploadURL();
        if (uploadUrl) {
            xhr.open('POST', uploadUrl, true);
            xhr.responseType = 'json';
        } else {
            throw Error('No onFileUploadMethod defined');
        }
    }

    _initListeners(resolve: any, reject: any, file: any, _uniekFileId: any) {
        const xhr = this.xhr;
        const loader = this.loader;
        const genericErrorText = `Couldn't upload file: ${file.name}.`;

        xhr.addEventListener('error', () => reject(genericErrorText));
        xhr.addEventListener('abort', () => reject());
        xhr.addEventListener('load', () => {
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

    _sendRequest(file: any, uniqueFileID: any) {
        const data = this._createFormDataUpload(file, { 'imageID': uniqueFileID })
        this.xhr.send(data);
    }

    _createFormDataUpload(file: any, metadata: any) {
        const formPost = new FormData();
        const metaFields = Object.keys(metadata);
        metaFields.forEach(function(item) {
            formPost.append(item, metadata[item]);
        });
        formPost.append('upload', file, file.name);

        return formPost;
    }

    _getFileUploadURL() {
        if (this.onFileUploadedMethodID)
            return this.uploadURL;
        return null;
    }

    upload() {
        if (!this.onFileUploadedMethodID) {
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

                this.loader.file.then((file: any) => {
                    reader.readAsDataURL(file);
                });
            });
        } else {
            return this.loader.file.then((file: any) => new Promise((resolve, reject) => {
                const uniqueFileID = this.uuidv4();
                this._initRequest();
                this._initListeners(resolve, reject, file, uniqueFileID);
                this._sendRequest(file, uniqueFileID);
            }));
        }
    }

    abort() {
        if (!this.onFileUploadedMethodID) {
            this.reader.abort();
        } else if (this.xhr) {
            this.xhr.abort();
        }
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
                value: (viewItem: any) => {
                    return editor.plugins.get('Mention').toMentionAttribute(viewItem, {
                        realValue: viewItem.getAttribute('data-real-value'),
                        format: viewItem.getAttribute('data-format'),
                        contenteditable: viewItem.getAttribute('contenteditable')
                    });
                }
            },
            converterPriority: 'high'
        } as any);

        editor.conversion.for('downcast').attributeToElement({
            model: 'mention',
            view: (modelAttributeValue: any, { writer }: any) => {
                if (!modelAttributeValue) {
                    return null;
                }

                const elementType = 'span';
                const attributes = {
                    class: 'mention svy-mention',
                    'data-mention': modelAttributeValue.id,
                    'data-real-value': (modelAttributeValue.realValue == undefined ? '' : modelAttributeValue.realValue),
                    'contenteditable': (modelAttributeValue.editable == undefined ? false : modelAttributeValue.editable),
                    'data-format': (modelAttributeValue.format || ''),
                }

                return writer.createAttributeElement(elementType, attributes, {
                    priority: 20,
                    id: modelAttributeValue.uid
                });
            },
            converterPriority: 'high'
        });
    }
}
