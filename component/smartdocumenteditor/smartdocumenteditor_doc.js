/**
 * A Servoy Extra Component that provides a rich document editor with advanced formatting capabilities.
 */

/**
 * Bound data provider identifier for the document content.
 */
var dataProviderID;

/**
 * Configure toolbar items
 */
var toolbarItems;

/**
 * Flag indicating whether the toolbar is visible.
 */
var showToolbar;

/**
 * Flag indicating whether to overwrite the default tab behavior for the editor.
 */
var overWriteTabForEditor;

/**
 * CSS style classes applied to the editor component.
 */
var styleClass;

/**
 * Flag indicating whether the editor content is editable.
 */
var editable;

/**
 * Editor's height to be set in a responsive form. When responsiveHeight is set to 0, the editor will use 100% height of the parent container. When value is set to -1 it will be based on the content.
 */
var responsiveHeight;

/**
 * Editor's min height. It's none by default. So when you want the height to be resposive and would like to have a min height for the editor, set responsiveHeight as 0 and this property with the value that fits your needs.
 */
var minHeight;

/**
 * Flag indicating whether the editor is visible.
 */
var visible;

/**
 * The view type of the editor. Possible values are "WEB" or "DOCUMENT".
 */
var viewType;

/**
 * The language used in the editor.
 */
var language;

/**
 * Flag indicating whether the inspector is shown. (Deprecated in later versions.)
 */
var showInspector;

/**
 * Array of mention feed configurations for the editor. Each mention feed defines a marker and associated feed items for quick insertion.
 */
var mentionFeeds;

/**
 * Attach a style sheet to add or overwrite content styles used by the editor. Make sure to prefix all classes with the <code>.ck-content</code> class.
 */
var editorStyleSheet;


var handlers = {
    /**
     * Fired when an action is triggered in the editor.
     *
     * @param {JSEvent} event The event object associated with the action.
     */
    onActionMethodID: function() {},

    /**
     * Fired when the editor's data changes.
     *
     * @param {dataproviderType} oldValue The previous document content.
     * @param {dataproviderType} newValue The new document content.
     * @param {JSEvent} event The event object associated with the data change.
     *
     * @return {Boolean} True if the new content is accepted, false otherwise.
     */
    onDataChangeMethodID: function() {},


    /**
     * Fired when the editor gains focus.
     *
     * @param {JSEvent} event The event object associated with the focus gain.
     */
    onFocusGainedMethodID: function() {},

    /**
     * Fired when the editor loses focus.
     *
     * @param {JSEvent} event The event object associated with the focus loss.
     */
    onFocusLostMethodID: function() {},

    /**
     * Fired when a file is uploaded through the editor.
     *
     * @param {Object} file The file object that was uploaded.
     */
    onFileUploadedMethodID: function() {},

    /**
     * Fired when the editor is fully initialized and ready.
     */
    onReady: function() {},

    /**
     * Fired when an error occurs in the editor.
     *
     * @param {String} errorMessage The error message.
     * @param {String} errorStack The error stack trace.
     */
    onError: function() {}
};

/**
 * (Re-)Creates the editor using the given config 
 * @example elements.%%elementName%%.create(config, onSuccess, onError);
 * @param {Object} config The configuration object containing settings for initializing or reinitializing the editor.
 */
function create(config) {
}

/**
 * Returns a toolbarItem that can be provided as one of the toolbar items on a toolbar property of an editor's config
 * @param {String} name the (unique) name of this toolbar item
 * @param {Function} onClick the callback method to fire when the item is clicked
 * @example elements.%%elementName%%.createToolbarItem(name, onClick);
 * @return {CustomType<smartdocumenteditor-smartdocumenteditor.toolbarItem>} A toolbar item object that can be used in the editor's toolbar configuration.
 */
function createToolbarItem(name, onClick) {
}

/**
 * Sets the mention feeds for the editor, allowing users to insert predefined mentions into the document.
 * Mention feeds provide a way to define markers and associated content for quick insertion, such as tagging users or inserting placeholders.
 *
 * @example
 * // Set mention feeds for the editor
 * var mentionFeeds = [
 *     { marker: '@', valueList: 'userList', feedItems: [{ displayValue: 'John Doe', realValue: 'john_doe' }] },
 *     { marker: '#', valueList: 'tagList', feedItems: [{ displayValue: 'ProjectX', realValue: 'project_x' }] }
 * ];
 * elements.%%elementName%%.setMentionFeeds(mentionFeeds);
 *
 * @param {Array<CustomType<smartdocumenteditor-smartdocumenteditor.mentionFeed>>} mentionFeeds An array of mention feed configurations. 
 * Each mention feed defines a marker (e.g., '@' or '#') and the associated feed items or value lists to provide options for insertion.
 */
function setMentionFeeds(mentionFeeds) {
}

/**
 * Force the autosave trigger of the editor to get all latest changes
 * @example dataprovider = elements.%%elementName%%.saveData();
 * @return {Object} the data currently in the editor.
 */
function saveData() {
}

/**
 * Add input to current cursor position, will return false when in readOnly mode
 * @example elements.%%elementName%%.addInputAtCursor(input);
 * @param {String} input The text or input content to insert at the current cursor position.
 * @return {Boolean} True if the input was successfully added; false if the editor is in readOnly mode.
 */
function addInputAtCursor(input) {
}

/**
 * Add tag to current cursor position, will return false when in readOnly mode
 * @example elements.%%elementName%%.addTagAtCursor(tag);
 * @param {String} marker The prefix marker (e.g., '@', '#') to associate with the tag.
 * @param {String} tag The tag content to insert at the current cursor position.
 * @return {Boolean} True if the tag was successfully added; false if the editor is in readOnly mode.
 */
function addTagAtCursor(marker, tag) {
}

/**
 * Executes the specified command with given parameters.
 * @example elements.%%elementName%%.executeCommand(command, commandParameters);
 * @param {String} command the name of the command to execute
 * @param {Object} [commandParameters] optional command parameters
 */
function executeCommand(command, commandParameters) {
}

/**
 * Inserts an image into the current cursor position within the editor.
 *
 * @example
 * // Insert an image into the editor
 * elements.%%elementName%%.insertImage('https://example.com/image.png');
 *
 * @param {String} source A path to a valid image accessible from the editor's context.
 */
function insertImage(source) {
}

/**
 * Retrieves the HTML content of the editor, optionally including inline CSS styles.
 *
 * @example
 * // Get HTML content with inline CSS applied
 * var htmlData = elements.%%elementName%%.getHTMLData(true, 'editorStylesheet.css');
 *
 * @param {Boolean} [withInlineCSS] Specifies whether to include inline CSS styles in the HTML content.
 * @param {String} [filterStylesheetName] The name of the stylesheet to filter the inline styles (if withInlineCSS is true).
 * @return {String|null} The HTML content of the editor, or null if the editor instance is not initialized.
 */
function getHTMLData(withInlineCSS, filterStylesheetName) {
}

/**
 * Retrieves the CSS styles applied to the editor.
 * Optionally filters the styles based on a provided stylesheet name.
 *
 * @example
 * // Get all CSS styles used in the editor
 * var cssData = elements.%%elementName%%.getCSSData();
 * 
 * // Get CSS styles from a specific stylesheet
 * var filteredCssData = elements.%%elementName%%.getCSSData('editorStylesheet.css');
 *
 * @param {String} [filterStylesheetName] The name of the stylesheet to filter styles. If omitted, all styles are returned.
 * @return {String} A string containing the CSS styles.
 */
function getCSSData() {
}

/**
 * Retrieves the CSS content used for printing the editor's content.
 *
 * @example
 * // Get the print CSS styles
 * var printCss = elements.%%elementName%%.getPrintCSSData();
 *
 * @return {String} The CSS content used for printing.
 */
function getPrintCSSData() {
}

/**
 * Preview Editor HTML data into the editor
 * @param {String} html The HTML content to display in the editor preview.
 * @param {Boolean} [readOnly] Set the editor to readOnly mode (default: true).
 * @public
 */
function previewHTML(html, readOnly) {
}

/**
 * Undo Preview Editor HTML data into the editor
 * @param {Boolean} [readOnly] Set component into readOnly mode (default: false)
 * @public 
 */
function undoPreviewHTML(readOnly) {
}

/**
 * Return if the editor is in preview mode (CKEditor readOnly).
 * @return {Boolean} True if the editor is in preview (readOnly) mode; otherwise, false.
 * @public
 */
function isInPreviewMode() {
}

/**
 * Request the focus to this editor.
 * @example %%prefix%%%%elementName%%.requestFocus();
 */
function requestFocus() {}

var svy_types = {

    /**
     * Represents the toolbar configuration for the editor.
     */
    toolbar: {
        /**
         * Array of toolbar items.
         */
        items: null,
        /**
         * Flag indicating whether toolbar items should not be grouped when the toolbar is full.
         */
        shouldNotGroupWhenFull: null,
    },
    /**
     * Represents a single toolbar item in the editor.
     */
    toolbarItem: {
        /**
         * Unique name of the toolbar item.
         */
        name: null,
        /**
         * The type of the toolbar item (e.g. bold, italic, fontSize, etc.).
         */
        type: null,
        /**
         * Label text for the toolbar item.
         */
        label: null,
        /**
         * When true, the toolbar item displays both an icon and text.
         */
        withText: null,
        /**
         * The keystroke associated with the toolbar item.
         */
        keystroke: null,
        /**
         * CSS style classes applied to the toolbar item.
         */
        styleClass: null,
        /**
         * Flag indicating whether the toolbar item is enabled.
         */
        isEnabled: null,
        /**
         * When true, the toolbar item shows a tooltip.
         */
        withTooltip: null,
        /**
         * Tooltip text for the toolbar item.
         */
        tooltip: null,
        /**
         * CSS style classes applied to the toolbar item's icon.
         */
        iconStyleClass: null,
        /**
         * Function to be called when the toolbar item is clicked.
         */
        onClick: null,
        /**
         * Value list providing options for the toolbar item.
         */
        valueList: null,
        /**
         * When true, the toolbar item ignores the editor's readOnly state.
         */
        ignoreReadOnly: null,
    },
    /**
     * Represents a mention feed configuration for the editor.
     */
    mentionFeed: {
        /**
         * Marker used to trigger the mention feed (e.g. '@' or '#').
         */
        marker: null,
        /**
         * Identifier for the value list providing options for the mention feed.
         */
        valueList: null,
        /**
         * Array of mention feed items.
         */
        feedItems: null,
        /**
         * Minimum number of characters required before triggering the mention feed.
         */
        minimumCharacters: null,
        /**
         * Flag indicating whether items in the mention feed are editable.
         */
        itemEditable: null,
    },
    /**
     * Represents an individual mention feed item.
     */
    mentionFeedItem: {
        /**
         * The display value of the mention feed item.
         */
        displayValue: null,
        /**
         * The actual value associated with the mention feed item.
         */
        realValue: null,
        /**
         * Format string for displaying the mention feed item.
         */
        format: null,
    }
}
