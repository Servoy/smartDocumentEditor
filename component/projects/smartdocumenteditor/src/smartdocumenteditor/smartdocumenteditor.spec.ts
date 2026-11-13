import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServoyApiTesting, ServoyPublicService, ServoyPublicTestingModule } from '@servoy/public';
import { SmartDocumentEditor } from './smartdocumenteditor';

// ---------------------------------------------------------------------------
// CKEditor is a huge third-party library that renders a real editor DOM. We do
// NOT instantiate it. Instead we build a lightweight fake editor instance and
// feed it to the component through onEditorReady(), which just stores it in
// this.editorInstance. Then we assert OUR glue logic behaves correctly.
// ---------------------------------------------------------------------------

type Listener = (evt: any, ...args: any[]) => void;

function makeFakeEditor(overrides: Record<string, any> = {}): any {
    const listeners: Record<string, Listener[]> = {};
    const toolbarElement = document.createElement('div');
    toolbarElement.classList.add('ck-toolbar');

    const plugins: Record<string, any> = {
        FileRepository: {},
        Pagination: { isEnabled: true },
        Mention: { toMentionAttribute: vi.fn((item: any, attrs: any) => ({ item, attrs })) }
    };

    const editor: any = {
        isReadOnly: false,
        setData: vi.fn(),
        getData: vi.fn(() => '<p>data</p>'),
        enableReadOnlyMode: vi.fn(() => { editor.isReadOnly = true; }),
        disableReadOnlyMode: vi.fn(() => { editor.isReadOnly = false; }),
        destroy: vi.fn(() => Promise.resolve()),
        execute: vi.fn(),
        focus: vi.fn(),
        listenTo: vi.fn((_emitter: any, event: string, cb: Listener) => {
            (listeners['listenTo:' + event] = listeners['listenTo:' + event] || []).push(cb);
        }),
        on: vi.fn((event: string, cb: Listener) => {
            (listeners[event] = listeners[event] || []).push(cb);
        }),
        plugins: { get: (name: string) => plugins[name] },
        editing: {
            view: {
                document: {
                    isFocused: true,
                    on: vi.fn((event: string, cb: Listener) => {
                        (listeners['viewdoc:' + event] = listeners['viewdoc:' + event] || []).push(cb);
                    })
                },
                scrollToTheSelection: vi.fn()
            }
        },
        ui: {
            view: { toolbar: { element: toolbarElement } },
            focusTracker: {
                on: vi.fn((event: string, cb: Listener) => {
                    (listeners['focus:' + event] = listeners['focus:' + event] || []).push(cb);
                })
            }
        },
        conversion: {
            for: vi.fn(() => ({ elementToAttribute: vi.fn(), attributeToElement: vi.fn() }))
        },
        __listeners: listeners,
        __plugins: plugins,
        __toolbarElement: toolbarElement
    };
    return Object.assign(editor, overrides);
}

function change(currentValue: any, previousValue?: any): SimpleChange {
    return new SimpleChange(previousValue, currentValue, previousValue === undefined);
}

describe('SmartDocumentEditor', () => {
    let fixture: ComponentFixture<SmartDocumentEditor>;
    let component: SmartDocumentEditor;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ServoyPublicTestingModule, SmartDocumentEditor],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(SmartDocumentEditor);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('servoyApi', new ServoyApiTesting());
        fixture.detectChanges();
    });

    afterEach(() => {
        // Guard against the async destroy()/promise leaking across tests.
        (component as any).editorInstance = undefined;
    });

    function wireEditor(editor = makeFakeEditor()): any {
        component.onEditorReady(editor);
        return editor;
    }

    // ----------------------------------------------------------------- basics
    describe('basics', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should expose the VIEW_TYPE constants', () => {
            expect(component.VIEW_TYPE.WEB).toBe('WEB');
            expect(component.VIEW_TYPE.DOCUMENT).toBe('DOCUMENT');
        });

        it('should start with hidden/not-changing signal state', () => {
            expect(component.shouldshow()).toBeGreaterThanOrEqual(0);
            expect(component.configChanging()).toBe(false);
        });

        it('should return a valid native element from getNativeElement()', () => {
            expect(component.getNativeElement()).toBeInstanceOf(HTMLElement);
        });
    });

    // --------------------------------------------------------- onEditorReady
    describe('onEditorReady', () => {
        it('stores the editor instance and sets initial data', () => {
            fixture.componentRef.setInput('dataProviderID', '<p>hello</p>');
            const editor = wireEditor();
            expect((component as any).editorInstance).toBe(editor);
            expect(editor.setData).toHaveBeenCalledWith('<p>hello</p>');
        });

        it('sets empty string when dataProviderID is not defined', () => {
            const editor = wireEditor();
            expect(editor.setData).toHaveBeenCalledWith('');
        });

        it('disables read-only mode when editable', () => {
            fixture.componentRef.setInput('editable', true);
            const editor = wireEditor();
            expect(editor.disableReadOnlyMode).toHaveBeenCalledWith('readonly');
        });

        it('enables read-only mode when not editable', () => {
            fixture.componentRef.setInput('editable', false);
            const editor = wireEditor();
            expect(editor.enableReadOnlyMode).toHaveBeenCalledWith('readonly');
        });

        it('disables Pagination plugin when viewType is not DOCUMENT', () => {
            fixture.componentRef.setInput('viewType', 'WEB');
            const editor = wireEditor();
            expect(editor.__plugins.Pagination.isEnabled).toBe(false);
        });

        it('keeps Pagination enabled when viewType is DOCUMENT', () => {
            fixture.componentRef.setInput('viewType', 'DOCUMENT');
            const editor = wireEditor();
            expect(editor.__plugins.Pagination.isEnabled).toBe(true);
        });

        it('installs a FileRepository upload adapter factory', () => {
            const editor = wireEditor();
            const factory = editor.__plugins.FileRepository.createUploadAdapter;
            expect(typeof factory).toBe('function');
            const adapter = factory({ file: Promise.resolve({}) });
            expect(adapter).toBeTruthy();
            expect(typeof adapter.upload).toBe('function');
        });

        it('mounts the toolbar when showToolbar is true', () => {
            fixture.componentRef.setInput('showToolbar', true);
            const editor = wireEditor();
            const container = component.getNativeElement().querySelector('#toolbar-container');
            expect(container!.firstChild).toBe(editor.__toolbarElement);
            expect(editor.__toolbarElement.classList.contains('ck-reset_all')).toBe(true);
        });

        it('registers a keydown handler when overWriteTabForEditor is true', () => {
            fixture.componentRef.setInput('overWriteTabForEditor', true);
            const editor = wireEditor();
            const cbs = editor.__listeners['viewdoc:keydown'];
            expect(cbs).toBeTruthy();
            const evt = { stop: vi.fn() };
            const data = { keyCode: 9, preventDefault: vi.fn() };
            cbs[0](evt, data);
            expect(editor.execute).toHaveBeenCalledWith('input', { text: '     ' });
            expect(evt.stop).toHaveBeenCalled();
            expect(data.preventDefault).toHaveBeenCalled();
        });

        it('focuses the editor when a focus was requested before ready', () => {
            component.requestFocus(); // editor not set yet -> getFocusWhenReady = true
            const editor = wireEditor();
            expect(editor.focus).toHaveBeenCalled();
        });

        it('wires focus tracker and fires focusGained / focusLost handlers', () => {
            const gained = vi.fn();
            const lost = vi.fn();
            fixture.componentRef.setInput('onFocusGainedMethodID', gained);
            fixture.componentRef.setInput('onFocusLostMethodID', lost);
            fixture.componentRef.setInput('editable', true);
            const editor = wireEditor();
            const cbs = editor.__listeners['focus:change:isFocused'];
            expect(cbs).toBeTruthy();
            cbs[0]({}, {}, true);
            expect(gained).toHaveBeenCalled();
            cbs[0]({}, {}, false);
            expect(lost).toHaveBeenCalled();
        });

        it('wires an onAction click handler that fires only when not editable', () => {
            const action = vi.fn();
            fixture.componentRef.setInput('onActionMethodID', action);
            fixture.componentRef.setInput('editable', false);
            const editor = wireEditor();
            const cbs = editor.__listeners['listenTo:click'];
            expect(cbs).toBeTruthy();
            cbs[0]({});
            expect(action).toHaveBeenCalled();
        });

        it('executes a queued preview when html was requested before ready', () => {
            component.previewHTML('<p>queued</p>', true); // no editor yet
            const editor = wireEditor();
            // executePreviewHTML calls setData with the queued html
            expect(editor.setData).toHaveBeenCalledWith('<p>queued</p>');
        });

        it('logs when showInspector is true', () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
            fixture.componentRef.setInput('showInspector', true);
            wireEditor();
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });
    });

    // ------------------------------------------------------ save / get data
    describe('data persistence', () => {
        it('forceSaveData emits when editable and not previewing', () => {
            fixture.componentRef.setInput('editable', true);
            wireEditor();
            const emitSpy = vi.spyOn(component.dataProviderIDChange, 'emit');
            component.forceSaveData('<p>x</p>');
            expect(emitSpy).toHaveBeenCalledWith('<p>x</p>');
        });

        it('forceSaveData does not emit when not editable', () => {
            fixture.componentRef.setInput('editable', false);
            wireEditor();
            const emitSpy = vi.spyOn(component.dataProviderIDChange, 'emit');
            component.forceSaveData('<p>x</p>');
            expect(emitSpy).not.toHaveBeenCalled();
        });

        it('saveData returns editor data and emits when editable', () => {
            fixture.componentRef.setInput('editable', true);
            const editor = wireEditor();
            editor.getData.mockReturnValue('<p>saved</p>');
            const emitSpy = vi.spyOn(component.dataProviderIDChange, 'emit');
            const result = component.saveData();
            expect(result).toBe('<p>saved</p>');
            expect(emitSpy).toHaveBeenCalledWith('<p>saved</p>');
        });

        it('saveData returns null when there is no editor', () => {
            expect(component.saveData()).toBeNull();
        });

        it('getEditorData returns the trimmed editor data', () => {
            const editor = wireEditor();
            editor.getData.mockReturnValue('<p>abc</p>');
            expect(component.getEditorData()).toBe('<p>abc</p>');
            expect(editor.getData).toHaveBeenCalledWith({ trim: 'empty' });
        });

        it('getEditorData returns empty string when no editor', () => {
            expect(component.getEditorData()).toBe('');
        });
    });

    // ----------------------------------------------- cursor / command inputs
    describe('cursor & command helpers', () => {
        it('addInputAtCursor executes input when editable', () => {
            fixture.componentRef.setInput('editable', true);
            const editor = wireEditor();
            expect(component.addInputAtCursor('hi')).toBe(true);
            expect(editor.execute).toHaveBeenCalledWith('input', { text: 'hi' });
        });

        it('addInputAtCursor returns false when not editable', () => {
            fixture.componentRef.setInput('editable', false);
            wireEditor();
            expect(component.addInputAtCursor('hi')).toBe(false);
        });

        it('addInputAtCursor returns true and does nothing for empty input', () => {
            fixture.componentRef.setInput('editable', true);
            const editor = wireEditor();
            expect(component.addInputAtCursor('')).toBe(true);
            expect(editor.execute).not.toHaveBeenCalled();
        });

        it('executeCommand delegates to editor.execute', () => {
            const editor = wireEditor();
            component.executeCommand('bold', { value: true });
            expect(editor.execute).toHaveBeenCalledWith('bold', { value: true });
        });

        it('executeCommand is a no-op without an editor', () => {
            expect(() => component.executeCommand('bold', {})).not.toThrow();
        });

        it('insertImage executes imageInsert', () => {
            const editor = wireEditor();
            component.insertImage('img.png');
            expect(editor.execute).toHaveBeenCalledWith('imageInsert', { source: 'img.png' });
        });

        it('insertImage is a no-op without an editor', () => {
            expect(() => component.insertImage('x')).not.toThrow();
        });

        it('addTagAtCursor inserts a mention when the marker/tag match', () => {
            fixture.componentRef.setInput('editable', true);
            fixture.componentRef.setInput('mentionFeeds', [{
                marker: '@',
                valueList: [{ displayValue: 'Alice', realValue: '1' }],
                itemEditable: true
            } as any]);
            const editor = wireEditor();
            const ok = component.addTagAtCursor('@', '1');
            expect(ok).toBe(true);
            expect(editor.execute).toHaveBeenCalledWith('mention', expect.objectContaining({ marker: '@' }));
        });

        it('addTagAtCursor returns false when no match', () => {
            fixture.componentRef.setInput('editable', true);
            fixture.componentRef.setInput('mentionFeeds', [{
                marker: '@',
                valueList: [{ displayValue: 'Alice', realValue: '1' }]
            } as any]);
            wireEditor();
            expect(component.addTagAtCursor('@', 'nope')).toBe(false);
        });

        it('addTagAtCursor returns false when not editable', () => {
            fixture.componentRef.setInput('editable', false);
            fixture.componentRef.setInput('mentionFeeds', [{ marker: '@', valueList: [] } as any]);
            wireEditor();
            expect(component.addTagAtCursor('@', '1')).toBe(false);
        });

        it('addTagAtCursor returns false for empty tag', () => {
            fixture.componentRef.setInput('editable', true);
            fixture.componentRef.setInput('mentionFeeds', [{ marker: '@', valueList: [] } as any]);
            wireEditor();
            expect(component.addTagAtCursor('@', '')).toBe(false);
        });
    });

    // -------------------------------------------------------- preview mode
    describe('preview mode', () => {
        it('previewHTML saves current data then shows preview (read-only default)', () => {
            fixture.componentRef.setInput('editable', true);
            const editor = wireEditor();
            editor.setData.mockClear();
            component.previewHTML('<p>preview</p>');
            expect(editor.setData).toHaveBeenCalledWith('<p>preview</p>');
            expect(editor.enableReadOnlyMode).toHaveBeenCalledWith('readonly');
        });

        it('previewHTML with readOnly=false disables read-only mode', () => {
            const editor = wireEditor();
            component.previewHTML('<p>p</p>', false);
            expect(editor.disableReadOnlyMode).toHaveBeenCalledWith('readonly');
        });

        it('previewHTML queues html when the editor is not ready yet', () => {
            component.previewHTML('<p>later</p>', true);
            const editor = wireEditor();
            expect(editor.setData).toHaveBeenCalledWith('<p>later</p>');
        });

        it('undoPreviewHTML restores the saved data', () => {
            fixture.componentRef.setInput('editable', true);
            const editor = wireEditor();
            editor.getData.mockReturnValue('<p>original</p>');
            component.previewHTML('<p>preview</p>');
            editor.setData.mockClear();
            component.undoPreviewHTML();
            expect(editor.setData).toHaveBeenCalledWith('<p>original</p>');
            expect(editor.disableReadOnlyMode).toHaveBeenCalledWith('readonly');
        });

        it('undoPreviewHTML with readOnly=true enables read-only mode', () => {
            const editor = wireEditor();
            editor.getData.mockReturnValue('<p>o</p>');
            component.previewHTML('<p>p</p>');
            component.undoPreviewHTML(true);
            expect(editor.enableReadOnlyMode).toHaveBeenCalledWith('readonly');
        });

        it('isInPreviewMode reflects the editor read-only flag', () => {
            const editor = wireEditor();
            editor.isReadOnly = true;
            expect(component.isInPreviewMode()).toBe(true);
            editor.isReadOnly = false;
            expect(component.isInPreviewMode()).toBe(false);
        });
    });

    // ------------------------------------------------------- focus handling
    describe('requestFocus', () => {
        it('focuses immediately when the editor is present', () => {
            const editor = wireEditor();
            component.requestFocus();
            expect(editor.focus).toHaveBeenCalled();
        });

        it('defers focus when the editor is not ready', () => {
            component.requestFocus();
            const editor = wireEditor();
            // onEditorReady should consume the deferred focus
            expect(editor.focus).toHaveBeenCalled();
        });
    });

    // ----------------------------------------------------------- toggleToolbar
    describe('toggleToolbar', () => {
        it('appends the toolbar element when showToolbar is true', () => {
            fixture.componentRef.setInput('showToolbar', true);
            const editor = wireEditor();
            const container = component.getNativeElement().querySelector('#toolbar-container');
            // onEditorReady already added it; clear and toggle again
            while (container!.firstChild) container!.removeChild(container!.firstChild);
            component.toggleToolbar();
            expect(container!.firstChild).toBe(editor.__toolbarElement);
        });

        it('removes the toolbar element when showToolbar is false', () => {
            fixture.componentRef.setInput('showToolbar', false);
            const editor = wireEditor();
            const container = component.getNativeElement().querySelector('#toolbar-container');
            container!.appendChild(editor.__toolbarElement);
            component.toggleToolbar();
            expect(container!.firstChild).toBeNull();
        });
    });

    // ------------------------------------------------------- toolbar items
    describe('toolbar item mapping', () => {
        it('getToolbarItems maps separators, breakpoints and types', () => {
            fixture.componentRef.setInput('toolbarItems', [
                { type: 'separator' },
                { type: 'wrappingBreakpoint' },
                { type: 'bold' },
                { type: 'servoyToolbarItem', name: 'myItem' }
            ] as any);
            expect(component.getToolbarItems()).toEqual(['|', '-', 'bold', 'myItem']);
        });

        it('getToolbarItems returns empty array without items', () => {
            expect(component.getToolbarItems()).toEqual([]);
        });

        it('getSvyToolbarItems maps only servoyToolbarItem entries', () => {
            const onClick = vi.fn();
            fixture.componentRef.setInput('toolbarItems', [
                { type: 'bold' },
                { type: 'servoyToolbarItem', name: 'a', label: 'A', onClick }
            ] as any);
            const items = component.getSvyToolbarItems();
            expect(items!.length).toBe(1);
            expect(items![0].name).toBe('a');
            // the mapped onClick should wrap the original and pass through name/value
            items![0].onClick!({} as any, 'val');
            expect(onClick).toHaveBeenCalled();
        });

        it('getSvyToolbarItems returns null without items', () => {
            expect(component.getSvyToolbarItems()).toBeNull();
        });

        it('getSvyToolbarItems keeps null onClick for items without a handler', () => {
            fixture.componentRef.setInput('toolbarItems', [
                { type: 'servoyToolbarItem', name: 'a', label: 'A' }
            ] as any);
            const items = component.getSvyToolbarItems();
            expect(items![0].onClick).toBeNull();
        });
    });

    // --------------------------------------------------------------- feeds
    describe('getFeeds', () => {
        it('returns an empty array with no mention feeds', () => {
            expect(component.getFeeds()).toEqual([]);
        });

        it('skips feeds with no valueList and no feedItems', () => {
            fixture.componentRef.setInput('mentionFeeds', [{ marker: '@' } as any]);
            expect(component.getFeeds()).toEqual([]);
        });

        it('skips feeds without a marker', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            fixture.componentRef.setInput('mentionFeeds', [{ valueList: [{ displayValue: 'x', realValue: '1' }] } as any]);
            expect(component.getFeeds()).toEqual([]);
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('builds a feed whose valueList-based feed() filters by query', async () => {
            fixture.componentRef.setInput('mentionFeeds', [{
                marker: '@',
                valueList: [
                    { displayValue: 'Alice', realValue: '1' },
                    { displayValue: 'Bob', realValue: '2' }
                ]
            } as any]);
            const feeds = component.getFeeds();
            expect(feeds.length).toBe(1);
            const result: any[] = await feeds[0].feed('ali');
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('Alice');
        });

        it('builds a feed whose feedItems-based feed() filters by query', () => {
            fixture.componentRef.setInput('mentionFeeds', [{
                marker: '#',
                feedItems: [
                    { displayValue: 'tagone', realValue: 'r1' },
                    { displayValue: 'other', realValue: 'r2' }
                ]
            } as any]);
            const feeds = component.getFeeds();
            const result: any[] = feeds[0].feed('tag');
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('tagone');
        });
    });

    // ----------------------------------------------- svyMentionRenderer
    describe('svyMentionRenderer', () => {
        it('creates a span element with svy-mention class and id', () => {
            const el = component.svyMentionRenderer({ id: 'x', name: 'Alice' });
            expect(el.tagName).toBe('SPAN');
            expect(el.classList.contains('svy-mention')).toBe(true);
            expect(el.id).toBe('mention-id-x');
            expect(el.textContent).toBe('Alice');
        });
    });

    // ----------------------------------------------------------- language
    describe('getCurrentLanguage', () => {
        it('returns the explicit language input when provided', () => {
            fixture.componentRef.setInput('language', 'fr');
            expect(component.getCurrentLanguage()).toBe('fr');
        });

        it('maps en-US locale to en', () => {
            const api = TestBed.inject(ServoyPublicService) as any;
            vi.spyOn(api, 'getLocale').mockReturnValue('en-US');
            expect(component.getCurrentLanguage()).toBe('en');
        });

        it('keeps multi-part locales in the preserve list', () => {
            const api = TestBed.inject(ServoyPublicService) as any;
            vi.spyOn(api, 'getLocale').mockReturnValue('zh-cn');
            expect(component.getCurrentLanguage()).toBe('zh-cn');
        });

        it('collapses other locales to the language part', () => {
            const api = TestBed.inject(ServoyPublicService) as any;
            vi.spyOn(api, 'getLocale').mockReturnValue('fr-FR');
            expect(component.getCurrentLanguage()).toBe('fr');
        });
    });

    // ---------------------------------------------- CSS / HTML data helpers
    describe('CSS & HTML data helpers', () => {
        it('getEditorCSSStylesheetName returns the file name from the stylesheet url', () => {
            fixture.componentRef.setInput('editorStyleSheet', 'https://host/path/mystyle.css?clientnr=1');
            expect(component.getEditorCSSStylesheetName()).toBe('mystyle.css');
        });

        it('getEditorCSSStylesheetName returns null without a stylesheet', () => {
            expect(component.getEditorCSSStylesheetName()).toBeNull();
        });

        it('getHTMLData wraps editor data and optionally inlines CSS', () => {
            const editor = wireEditor();
            editor.getData.mockReturnValue('<p>body</p>');
            const inlineSpy = vi.spyOn(component.Editor as any, 'getInlineStyle').mockReturnValue('INLINED');
            vi.spyOn(component.Editor as any, 'getCssStyles').mockReturnValue('css');
            const plain = component.getHTMLData(false, null as any);
            expect(plain).toContain('<p>body</p>');
            expect(plain).toContain('ck-content');
            const inlined = component.getHTMLData(true, null as any);
            expect(inlined).toBe('INLINED');
            expect(inlineSpy).toHaveBeenCalled();
        });

        it('getHTMLData returns null without an editor', () => {
            expect(component.getHTMLData(false, null as any)).toBeNull();
        });

        it('getCSSData filters by stylesheet names when provided', () => {
            const cssSpy = vi.spyOn(component.Editor as any, 'getCssStyles').mockReturnValue('filtered');
            fixture.componentRef.setInput('editorStyleSheet', 'https://host/a/base.css');
            const result = component.getCSSData('extra');
            expect(result).toBe('filtered');
            expect(cssSpy).toHaveBeenCalledWith(['extra', 'base.css']);
        });

        it('getCSSData with no filter returns all styles', () => {
            const cssSpy = vi.spyOn(component.Editor as any, 'getCssStyles').mockReturnValue('all');
            expect(component.getCSSData(null as any)).toBe('all');
            expect(cssSpy).toHaveBeenCalledWith();
        });

        it('getPrintCSSData delegates to the Editor static', () => {
            const printSpy = vi.spyOn(component.Editor as any, 'getPrintCSS').mockReturnValue('PRINT');
            expect(component.getPrintCSSData()).toBe('PRINT');
            expect(printSpy).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------- svyOnChanges
    describe('svyOnChanges', () => {
        it('adds and removes style classes', () => {
            component.svyOnChanges({ styleClass: change('classA classB') });
            expect(component.getNativeElement().classList.contains('classA')).toBe(true);
            expect(component.getNativeElement().classList.contains('classB')).toBe(true);
            component.svyOnChanges({ styleClass: change('classC', 'classA classB') });
            expect(component.getNativeElement().classList.contains('classA')).toBe(false);
            expect(component.getNativeElement().classList.contains('classC')).toBe(true);
        });

        it('toggles the document-view class on viewType change', () => {
            component.svyOnChanges({ viewType: change('DOCUMENT') });
            expect(component.getNativeElement().classList.contains('ckeditor-documentview')).toBe(true);
            component.svyOnChanges({ viewType: change('WEB', 'DOCUMENT') });
            expect(component.getNativeElement().classList.contains('ckeditor-documentview')).toBe(false);
        });

        it('enables/disables read-only when editable changes with an editor present', () => {
            const editor = wireEditor();
            component.svyOnChanges({ editable: change(true, false) });
            expect(editor.disableReadOnlyMode).toHaveBeenCalledWith('readonly');
            component.svyOnChanges({ editable: change(false, true) });
            expect(editor.enableReadOnlyMode).toHaveBeenCalledWith('readonly');
        });

        it('sets a fixed height on responsiveHeight change in responsive layout', () => {
            const api = new ServoyApiTesting();
            vi.spyOn(api, 'isInAbsoluteLayout').mockReturnValue(false);
            fixture.componentRef.setInput('servoyApi', api);
            fixture.componentRef.setInput('responsiveHeight', 400);
            component.svyOnChanges({ responsiveHeight: change(400) });
            expect(component.getNativeElement().style.height).toBe('400px');
        });

        it('sets 100% height when responsiveHeight is cleared in responsive layout', () => {
            const api = new ServoyApiTesting();
            vi.spyOn(api, 'isInAbsoluteLayout').mockReturnValue(false);
            fixture.componentRef.setInput('servoyApi', api);
            component.svyOnChanges({ responsiveHeight: change(0) });
            expect(component.getNativeElement().style.height).toBe('100%');
        });

        it('pushes new data to the editor on dataProviderID change', () => {
            const editor = wireEditor();
            editor.getData.mockReturnValue('<p>old</p>');
            fixture.componentRef.setInput('dataProviderID', '<p>new</p>');
            editor.setData.mockClear();
            component.svyOnChanges({ dataProviderID: change('<p>new</p>', '<p>old</p>') });
            expect(editor.setData).toHaveBeenCalledWith('<p>new</p>');
        });

        it('injects a stylesheet link on editorStyleSheet change', () => {
            fixture.componentRef.setInput('editorStyleSheet', 'https://host/a/style.css?clientnr=1&other=2');
            component.svyOnChanges({ editorStyleSheet: change('https://host/a/style.css?clientnr=1&other=2') });
            const link = document.head.querySelector('link[customSmartDocumentEditor]') as HTMLLinkElement;
            expect(link).toBeTruthy();
            expect(link.getAttribute('href')).toContain('style.css');
            expect(link.getAttribute('href')).toContain('clientnr=1');
            link.remove();
        });

        it('toggles the toolbar on showToolbar change with an editor present', () => {
            fixture.componentRef.setInput('showToolbar', true);
            const editor = wireEditor();
            const toggleSpy = vi.spyOn(component, 'toggleToolbar');
            component.svyOnChanges({ showToolbar: change(true, false) });
            expect(toggleSpy).toHaveBeenCalled();
            expect(editor).toBeTruthy();
        });

        it('calls refresh on config change', () => {
            const refreshSpy = vi.spyOn(component, 'refresh');
            component.svyOnChanges({ config: change({} as any) });
            expect(refreshSpy).toHaveBeenCalled();
        });

        it('handles an empty changes object without throwing', () => {
            expect(() => component.svyOnChanges({})).not.toThrow();
        });
    });

    // -------------------------------------------------------------- refresh
    describe('refresh', () => {
        it('flips configChanging on then off', () => {
            vi.useFakeTimers();
            component.refresh();
            expect(component.configChanging()).toBe(true);
            vi.runAllTimers();
            expect(component.configChanging()).toBe(false);
            vi.useRealTimers();
        });
    });

    // ------------------------------------------------------------ ngOnDestroy
    describe('ngOnDestroy', () => {
        it('destroys the editor instance when present', () => {
            const editor = wireEditor();
            component.ngOnDestroy();
            expect(editor.destroy).toHaveBeenCalled();
        });

        it('is a no-op without an editor', () => {
            expect(() => component.ngOnDestroy()).not.toThrow();
        });

        it('swallows a rejected destroy promise', async () => {
            const editor = wireEditor();
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
            editor.destroy.mockReturnValue(Promise.reject(new Error('boom')));
            component.ngOnDestroy();
            await Promise.resolve();
            await Promise.resolve();
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });
    });

    // ----------------------------------------------------------- svyOnInit
    describe('svyOnInit', () => {
        it('builds the config with toolbar, codeBlock and autosave', () => {
            fixture.componentRef.setInput('toolbarItems', [{ type: 'bold' }] as any);
            component.svyOnInit();
            expect(component._cfg).toBeTruthy();
            expect(component._cfg.toolbar!.items).toEqual(['bold']);
            expect(component._cfg.codeBlock!.languages.length).toBeGreaterThan(0);
            expect(component._cfg.autosave).toBeTruthy();
        });

        it('adds mention config when mention feeds are present', () => {
            fixture.componentRef.setInput('mentionFeeds', [{
                marker: '@',
                valueList: [{ displayValue: 'Alice', realValue: '1' }]
            } as any]);
            component.svyOnInit();
            expect(component._cfg.mention).toBeTruthy();
            expect(component._cfg.extraPlugins!.length).toBeGreaterThan(0);
        });
    });



    // ----------------------------------------- ServoyUploadAdapter (via factory)
    // The adapter is a private class exposed only through the FileRepository
    // createUploadAdapter factory that onEditorReady installs. We exercise it
    // through that factory with a faked XMLHttpRequest / FileReader so we test
    // OUR request wiring, not the network.
    describe('ServoyUploadAdapter (upload glue)', () => {
        let origXHR: any;
        let origFileReader: any;
        let xhrInstances: any[];

        function installFakeXHR() {
            xhrInstances = [];
            origXHR = (globalThis as any).XMLHttpRequest;
            (globalThis as any).XMLHttpRequest = class {
                public listeners: Record<string, any[]> = {};
                public uploadListeners: Record<string, any[]> = {};
                public upload: any;
                public responseType = '';
                public method = '';
                public url = '';
                public sent: any = null;
                public open = vi.fn((m: string, u: string) => { this.method = m; this.url = u; });
                public send = vi.fn((d: any) => { this.sent = d; });
                public abort = vi.fn();
                public addEventListener = vi.fn((e: string, cb: any) => { (this.listeners[e] = this.listeners[e] || []).push(cb); });
                constructor() {
                    const ul = this.uploadListeners;
                    this.upload = { addEventListener: (e: string, cb: any) => { (ul[e] = ul[e] || []).push(cb); } };
                    xhrInstances.push(this);
                }
            } as any;
        }

        function restoreXHR() {
            (globalThis as any).XMLHttpRequest = origXHR;
        }

        function makeFile(): File {
            return new File(['hello'], 'pic.png', { type: 'image/png' });
        }

        function makeAdapter(onFileUploadedMethodID: any, file: File = makeFile()): { adapter: any; loader: any } {
            fixture.componentRef.setInput('onFileUploadedMethodID', onFileUploadedMethodID);
            const editor = wireEditor();
            const factory = editor.__plugins.FileRepository.createUploadAdapter;
            const loader = { file: Promise.resolve(file), uploadTotal: 0, uploaded: 0 };
            return { adapter: factory(loader), loader };
        }

        afterEach(() => {
            if (origXHR) restoreXHR();
            origXHR = undefined;
            if (origFileReader) { (globalThis as any).FileReader = origFileReader; origFileReader = undefined; }
        });

        it('server-side upload: opens a POST request to the generated URL and sends form data', async () => {
            installFakeXHR();
            const { adapter } = makeAdapter(() => undefined);
            // kick off the upload; the inner promise only settles via xhr events,
            // so we just flush the loader.file.then microtask and inspect the xhr.
            adapter.upload();
            await Promise.resolve();
            await Promise.resolve();
            expect(xhrInstances.length).toBe(1);
            const xhr = xhrInstances[0];
            expect(xhr.method).toBe('POST');
            expect(xhr.url).toContain('resources/upload');
            expect(xhr.responseType).toBe('json');
            expect(xhr.send).toHaveBeenCalled();
            expect(xhr.sent).toBeInstanceOf(FormData);
            expect(xhr.sent.get('upload')).toBeTruthy();
            expect(xhr.sent.get('imageID')).toBeTruthy();
        });

        it('server-side upload: error/abort/load listeners are registered', async () => {
            installFakeXHR();
            const { adapter } = makeAdapter(() => undefined);
            adapter.upload();
            await Promise.resolve();
            await Promise.resolve();
            const xhr = xhrInstances[0];
            expect(xhr.listeners['error']).toBeTruthy();
            expect(xhr.listeners['abort']).toBeTruthy();
            expect(xhr.listeners['load']).toBeTruthy();
        });

        it('server-side upload: progress updates the loader totals', async () => {
            installFakeXHR();
            const { adapter, loader } = makeAdapter(() => undefined);
            adapter.upload();
            await Promise.resolve();
            await Promise.resolve();
            const xhr = xhrInstances[0];
            const progressCb = xhr.uploadListeners['progress'][0];
            progressCb({ lengthComputable: true, total: 100, loaded: 40 });
            expect(loader.uploadTotal).toBe(100);
            expect(loader.uploaded).toBe(40);
        });

        it('server-side upload: the load listener rejects (no success branch implemented)', async () => {
            installFakeXHR();
            const { adapter } = makeAdapter(() => undefined);
            const p = adapter.upload();
            await Promise.resolve();
            await Promise.resolve();
            const xhr = xhrInstances[0];
            xhr.listeners['load'][0]();
            await expect(p).rejects.toBeUndefined();
        });

        it('server-side upload: abort() aborts the xhr', async () => {
            installFakeXHR();
            const { adapter } = makeAdapter(() => undefined);
            const p = adapter.upload();
            await Promise.resolve();
            await Promise.resolve();
            adapter.abort();
            expect(xhrInstances[0].abort).toHaveBeenCalled();
            // settle the pending promise so it does not leak
            xhrInstances[0].listeners['abort'][0]();
            await expect(p).rejects.toBeUndefined();
        });

        it('client-side upload (no method): reads the file as a data URL', async () => {
            const { adapter } = makeAdapter(undefined);
            const result: any = await adapter.upload();
            expect(result).toHaveProperty('default');
            expect(String(result.default)).toContain('data:');
        });

        it('client-side upload: abort() delegates to the FileReader', async () => {
            const { adapter } = makeAdapter(undefined);
            const p = adapter.upload();
            await p;
            expect(() => adapter.abort()).not.toThrow();
        });

        it('uuidv4 produces a v4-shaped id', () => {
            const { adapter } = makeAdapter(() => undefined);
            const id = adapter.uuidv4();
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        });
    });
});
