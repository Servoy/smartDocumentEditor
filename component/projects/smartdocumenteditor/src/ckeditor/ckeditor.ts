/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// The editor creator to use.
import {DecoupledEditor as DecoupledEditorBase} from '@ckeditor/ckeditor5-editor-decoupled';

import {Essentials} from '@ckeditor/ckeditor5-essentials';
import {Alignment} from '@ckeditor/ckeditor5-alignment';
import {FontSize} from '@ckeditor/ckeditor5-font';
import {FontFamily} from '@ckeditor/ckeditor5-font';
import {FontColor} from '@ckeditor/ckeditor5-font';
import {FontBackgroundColor} from '@ckeditor/ckeditor5-font';
import {CKFinderUploadAdapter} from '@ckeditor/ckeditor5-adapter-ckfinder';
import {Autoformat} from '@ckeditor/ckeditor5-autoformat';
import {Bold} from '@ckeditor/ckeditor5-basic-styles';
import {Italic} from '@ckeditor/ckeditor5-basic-styles';
import {Strikethrough} from '@ckeditor/ckeditor5-basic-styles';
import {Underline} from '@ckeditor/ckeditor5-basic-styles';
import {BlockQuote} from '@ckeditor/ckeditor5-block-quote';
import {Code} from '@ckeditor/ckeditor5-basic-styles';
import {Subscript} from '@ckeditor/ckeditor5-basic-styles';
import {Superscript} from '@ckeditor/ckeditor5-basic-styles';
import {CKFinder} from '@ckeditor/ckeditor5-ckfinder';
import {EasyImage} from '@ckeditor/ckeditor5-easy-image';
import {Heading} from '@ckeditor/ckeditor5-heading';
import {HorizontalLine} from '@ckeditor/ckeditor5-horizontal-line';
import {Image} from '@ckeditor/ckeditor5-image';
import {ImageCaption} from '@ckeditor/ckeditor5-image';
import {ImageStyle} from '@ckeditor/ckeditor5-image';
import {ImageToolbar} from '@ckeditor/ckeditor5-image';
import {ImageUpload} from '@ckeditor/ckeditor5-image';
import {ImageResize} from '@ckeditor/ckeditor5-image';
import {ImageInsert} from '@ckeditor/ckeditor5-image';
import {Indent} from '@ckeditor/ckeditor5-indent';
import {IndentBlock} from '@ckeditor/ckeditor5-indent';
import {Link} from '@ckeditor/ckeditor5-link';
import {List} from '@ckeditor/ckeditor5-list';
import {MediaEmbed} from '@ckeditor/ckeditor5-media-embed';
import {Paragraph} from '@ckeditor/ckeditor5-paragraph';
import {PasteFromOffice} from '@ckeditor/ckeditor5-paste-from-office';
import {Table} from '@ckeditor/ckeditor5-table';
import {TableToolbar} from '@ckeditor/ckeditor5-table';
import {TableProperties} from '@ckeditor/ckeditor5-table';
import {TableCellProperties} from '@ckeditor/ckeditor5-table';
import {TextTransformation} from '@ckeditor/ckeditor5-typing';
import {Highlight} from '@ckeditor/ckeditor5-highlight';
import {TodoList} from '@ckeditor/ckeditor5-list';
import {PageBreak} from '@ckeditor/ckeditor5-page-break';
import {SpecialCharacters} from '@ckeditor/ckeditor5-special-characters';
import {SpecialCharactersEssentials} from '@ckeditor/ckeditor5-special-characters';
import {Autosave} from '@ckeditor/ckeditor5-autosave/';
import {Mention} from '@ckeditor/ckeditor5-mention';
import {CloudServices} from '@ckeditor/ckeditor5-cloud-services';
import {Pagination} from '@ckeditor/ckeditor5-pagination';
import {EditorConfig} from '@ckeditor/ckeditor5-core';

import {SvyToolbarItem} from '../plugins/toolbar/svy-toolbar-item';

import juice from 'juice';

export default class DecoupledEditor extends DecoupledEditorBase {
    getInlineStyle(data, style) {
        console.log('test')
        return juice.inlineContent(data, style||this.getCssStyles(), {preserveMediaQueries: false, preserveImportant: true, preserveFontFaces: false});
    }
    
    getCssStyles(filterStylesheetNames?: string[]) {
        let css = [];
        let filterByNames = [];
        if(filterStylesheetNames && filterStylesheetNames.length > 0) {
            for(const name of filterStylesheetNames) {
                if(name) {
                    if(!name.endsWith('.css')) {
                        filterByNames.push(name + '.css');
                    } else {
                        filterByNames.push(name);
                    }
                }
            }
            filterByNames.push('smartdocumenteditor.css');
        }
        for (const sheet of document.styleSheets)
        {
             if(!filterByNames.length || (sheet.href && filterByNames.includes(sheet.href.split('/').pop().split('?').shift())) ) {
                let rules = sheet.cssRules? sheet.cssRules : sheet.rules;
                if (rules) {
                    css.push('\n/* Stylesheet : '+(sheet.href||'[inline styles]')+' */');
                    for (const rule of rules)
                    {
                        if (rule.cssText)
                            css.push(rule.cssText);
                        else if (rule instanceof CSSStyleRule)
                            css.push(rule.selectorText+' {\n'+rule.style.cssText+'\n}\n');
                    }
                }
             }
        }
        return css.join('\n')+'\n';
    }
    
    /**
     * @deprecated Should move to module to make it also work headless;
     * @returns {String}
     */
    getPrintCSS() {
        //Return the minimized version of lib/content-styles.css
        return ":root{--ck-color-mention-background:hsla(341, 100%, 30%, 0.1);--ck-color-mention-text:hsl(341, 100%, 30%);--ck-highlight-marker-blue:hsl(201, 97%, 72%);--ck-highlight-marker-green:hsl(120, 93%, 68%);--ck-highlight-marker-pink:hsl(345, 96%, 73%);--ck-highlight-marker-yellow:hsl(60, 97%, 73%);--ck-highlight-pen-green:hsl(112, 100%, 27%);--ck-highlight-pen-red:hsl(0, 85%, 49%);--ck-image-style-spacing:1.5em;--ck-todo-list-checkmark-size:16px}.ck-content .text-tiny{font-size:.7em}.ck-content .text-small{font-size:.85em}.ck-content .text-big{font-size:1.4em}.ck-content .text-huge{font-size:1.8em}.ck-content pre{padding:1em;color:hsl(0,0%,20.8%);background:hsla(0,0%,78%,.3);border:1px solid #c4c4c4;border-radius:2px;text-align:left;direction:ltr;tab-size:4;white-space:pre-wrap;font-style:normal;min-width:200px}.ck-content pre code{background:unset;padding:0;border-radius:0}.ck-content hr{margin:15px 0;height:4px;background:#ddd;border:0}.ck-content .marker-yellow{background-color:var(--ck-highlight-marker-yellow)}.ck-content .marker-green{background-color:var(--ck-highlight-marker-green)}.ck-content .marker-pink{background-color:var(--ck-highlight-marker-pink)}.ck-content .marker-blue{background-color:var(--ck-highlight-marker-blue)}.ck-content .pen-red{color:var(--ck-highlight-pen-red);background-color:transparent}.ck-content .pen-green{color:var(--ck-highlight-pen-green);background-color:transparent}.ck-content .image-style-side{float:right;margin-left:var(--ck-image-style-spacing);max-width:50%}.ck-content .image-style-align-left{float:left;margin-right:var(--ck-image-style-spacing)}.ck-content .image-style-align-center{margin-left:auto;margin-right:auto}.ck-content .image-style-align-right{float:right;margin-left:var(--ck-image-style-spacing)}.ck-content .image>figcaption{display:table-caption;caption-side:bottom;word-break:break-word;color:#333;background-color:#f7f7f7;padding:.6em;font-size:.75em;outline-offset:-1px}.ck-content .image{display:table;clear:both;text-align:center;margin:1em auto}.ck-content .image img{display:block;margin:0 auto;max-width:100%;min-width:50px}.ck-content .image.image_resized{max-width:100%;display:block;box-sizing:border-box}.ck-content .image.image_resized img{width:100%}.ck-content .image.image_resized>figcaption{display:block}.ck-content span[lang]{font-style:italic}.ck-content blockquote{overflow:hidden;padding-right:1.5em;padding-left:1.5em;margin-left:0;margin-right:0;font-style:italic;border-left:solid 5px #ccc}.ck-content[dir=rtl] blockquote{border-left:0;border-right:solid 5px #ccc}.ck-content code{background-color:hsla(0,0%,78%,.3);padding:.15em;border-radius:2px}.ck-content .table{margin:1em auto;display:table}.ck-content .table table{border-collapse:collapse;border-spacing:0;width:100%;height:100%;border:1px double #b2b2b2}.ck-content .table table td,.ck-content .table table th{min-width:2em;padding:.4em;border:1px solid #bfbfbf}.ck-content .table table th{font-weight:700;background:hsla(0,0%,0%,5%)}.ck-content[dir=rtl] .table th{text-align:right}.ck-content[dir=ltr] .table th{text-align:left}.ck-content .page-break{position:relative;clear:both;padding:5px 0;display:flex;align-items:center;justify-content:center}.ck-content .page-break::after{content:'';position:absolute;width:100%}.ck-content .page-break__label{position:relative;z-index:1;padding:.3em .6em;display:block;text-transform:uppercase;border:1px solid #c4c4c4;border-radius:2px;font-family:Helvetica,Arial,Tahoma,Verdana,Sans-Serif;font-size:.75em;font-weight:700;color:#333;background:#fff;box-shadow:2px 2px 1px hsla(0,0%,0%,.15);-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.ck-content .media{clear:both;margin:1em 0;display:block;min-width:15em}.ck-content .todo-list{list-style:none}.ck-content .todo-list li{margin-bottom:5px}.ck-content .todo-list li .todo-list{margin-top:5px}.ck-content .todo-list .todo-list__label>input{-webkit-appearance:none;display:inline-block;position:relative;width:var(--ck-todo-list-checkmark-size);height:var(--ck-todo-list-checkmark-size);vertical-align:middle;border:0;left:-25px;margin-right:-15px;right:0;margin-left:0}.ck-content .todo-list .todo-list__label>input::before{display:block;position:absolute;box-sizing:border-box;content:'';width:100%;height:100%;border:1px solid #333;border-radius:2px;transition:250ms ease-in-out box-shadow,250ms ease-in-out background,250ms ease-in-out border}.ck-content .todo-list .todo-list__label>input::after{display:block;position:absolute;box-sizing:content-box;pointer-events:none;content:'';left:calc(var(--ck-todo-list-checkmark-size)/ 3);top:calc(var(--ck-todo-list-checkmark-size)/ 5.3);width:calc(var(--ck-todo-list-checkmark-size)/ 5.3);height:calc(var(--ck-todo-list-checkmark-size)/ 2.6);border-style:solid;border-color:transparent;border-width:0 calc(var(--ck-todo-list-checkmark-size)/ 8) calc(var(--ck-todo-list-checkmark-size)/ 8) 0;transform:rotate(45deg)}.ck-content .todo-list .todo-list__label>input[checked]::before{background:#25ab33;border-color:#25ab33}.ck-content .todo-list .todo-list__label>input[checked]::after{border-color:#fff}.ck-content .todo-list .todo-list__label .todo-list__label__description{vertical-align:middle}.ck-content .raw-html-embed{margin:1em auto;min-width:15em;font-style:normal}.ck-content .mention{background:var(--ck-color-mention-background);color:var(--ck-color-mention-text)}@media print{.ck-content .page-break{padding:0}.ck-content .page-break::after{display:none}}@media print{body,html{width:210mm;height:297mm}.ck-content{margin:0;border:initial;border-radius:initial;width:initial;min-height:initial;box-shadow:initial;background:initial;page-break-after:always}}"
    }
}

// Plugins to include in the build.
DecoupledEditor.builtinPlugins = [
    Essentials,
    Alignment,
    FontSize,
    FontFamily,
    FontColor,
    FontBackgroundColor,
    CKFinderUploadAdapter,
    Autoformat,
    Bold,
    Italic,
    Strikethrough,
    Underline,
    BlockQuote,
    Code,
    Subscript,
    Superscript,
    CKFinder,
    CloudServices,
    EasyImage,
    Heading,
    HorizontalLine,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    ImageResize,
    ImageInsert,
    Indent,
    IndentBlock,
    Link,
    List,
    MediaEmbed,
    Paragraph,
    PasteFromOffice,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    TextTransformation,
    Highlight,
    TodoList,
    PageBreak,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Autosave,
    Mention,
    Pagination,
    SvyToolbarItem
];


// Editor configuration.
DecoupledEditor.defaultConfig = {
    toolbar: {
        items: [
            'previousPage',
            'nextPage',
            'pageNavigation', 
            '|',
            'heading',
            'simpleBox',
            '|',
            'fontfamily',
            'fontsize',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'code',
            'subscript',
            'superscript',
            'highlight',
            '|',
            'alignment',
            '|',
            'numberedList',
            'bulletedList',
            'TodoList',
            '|',
            'indent',
            'outdent',
            '|',
            'link',
            'pageBreak',
            'blockquote',
            'imageUpload',
            'insertTable',
            'mediaEmbed',
            'specialCharacters',
            '|',
            'undo',
            'redo'
        ]
    },
    image: {
        styles: [
            'full',
            'alignLeft',
            'alignRight'
        ],
        toolbar: [
            'imageStyle:inline',
            'imageStyle:block',
            'imageStyle:side',
            '|',
            'toggleImageCaption',
            'imageTextAlternative'
        ]
    },
    table: {
        contentToolbar: [
            'tableColumn',
            'tableRow',
            'mergeTableCells',
            'tableCellProperties',
            'tableProperties'
        ]
    },
    // This value must be kept in sync with the language defined in webpack.config.js.
    language: 'en',
    pagination: {
        // A4
        pageWidth: '21cm',
        pageHeight: '29.7cm',
        pageMargins: {
            top: '20mm',
            bottom: '20mm',
            right: '12mm',
            left: '12mm'
        }
    },
    licenseKey: 'dnVNblgyNmdaWjg2ay9tT2o2dU9vVXFqdHhKa1U2MTJwSVkvUmhPVVRMUWU1OXl3V1VnTWZTSU5YdTgyRE1IdWJnPT0tTWpBeU5UQTFNREU9'
} as EditorConfig;
