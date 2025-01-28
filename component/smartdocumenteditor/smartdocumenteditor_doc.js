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