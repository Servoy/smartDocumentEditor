import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ServoyApiTesting, ServoyPublicTestingModule } from '@servoy/public';
import { SmartDocumentEditor } from './smartdocumenteditor';

// Smoke test for the SmartDocumentEditor component. The real CKEditor
// DecoupledEditor is a heavy browser dependency: we never trigger a real
// editor instantiation here (the <ckeditor> element is only rendered once the
// async editor module resolves and 'shouldshow' becomes > 0). NO_ERRORS_SCHEMA
// lets the template's <ckeditor> element be ignored so the component can be
// created in jsdom.
describe('SmartDocumentEditor', () => {
    let fixture: ComponentFixture<SmartDocumentEditor>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ServoyPublicTestingModule, SmartDocumentEditor],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(SmartDocumentEditor);
        fixture.componentRef.setInput('servoyApi', new ServoyApiTesting());
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should expose the VIEW_TYPE constants', () => {
        expect(fixture.componentInstance.VIEW_TYPE.WEB).toBe('WEB');
        expect(fixture.componentInstance.VIEW_TYPE.DOCUMENT).toBe('DOCUMENT');
    });

    it('should start with hidden/not-changing signal state', () => {
        expect(fixture.componentInstance.shouldshow()).toBeGreaterThanOrEqual(0);
        expect(fixture.componentInstance.configChanging()).toBe(false);
    });

    it('should return a valid native element from getNativeElement()', () => {
        expect(fixture.componentInstance.getNativeElement()).toBeInstanceOf(HTMLElement);
    });
});