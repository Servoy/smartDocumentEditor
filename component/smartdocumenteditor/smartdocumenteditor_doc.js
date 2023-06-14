/**
 * (Re-)Creates the editor using the given config 
 * @example elements.%%elementName%%.create(config, onSuccess, onError);
 * @param {*} config 
 */
function create(config) {
}

/**
 * Returns a toolbarItem that can be provided as one of the toolbar items on a toolbar property of an editor's config
 * @param {String} name the (unique) name of this toolbar item
 * @param {Function} onClick the callback method to fire when the item is clicked
 * @example elements.%%elementName%%.createToolbarItem(name, onClick);
 * @return {CustomType<smartdocumenteditor-smartdocumenteditor.toolbarItem>}
 */
function createToolbarItem(name, onClick) {
}

/**
 * @param {Array<CustomType<smartdocumenteditor-smartdocumenteditor.mentionFeed>>} mentionFeeds
 * @public 
 */
function setMentionFeeds(mentionFeeds) {
}

/**
 * Force the autosave trigger of the editor to get all latest changes
 * @example dataprovider = elements.%%elementName%%.saveData();
 * @returns {Object} the data currently in the editor.
 */
function saveData() {
}

/**
 * Add input to current cursor position, will return false when in readOnly mode
 * @example elements.%%elementName%%.addInputAtCursor(input);
 * @param {String} input
 * @returns {Boolean}
 */
function addInputAtCursor(input) {
}

/**
 * Add tag to current cursor position, will return false when in readOnly mode
 * @example elements.%%elementName%%.addTagAtCursor(tag);
 * @param {String} marker
 * @param {String} tag
 * @returns {Boolean}
 */
function addTagAtCursor(marker, tag) {
}

/**
 * Executes the specified command with given parameters.
 * @example elements.%%elementName%%.executeCommand(command, commandParameters);
 * @param {String} command the name of the command to execute
 * @param {*} [commandParameters] optional command parameters
 */
function executeCommand(command, commandParameters) {
}

/**
 * Executes the specified command with given parameters.
 * @example elements.%%elementName%%.executeCommand(command, commandParameters);
 * @param {String} command the name of the command to execute
 * @param {*} [commandParameters] optional command parameters
 */
function insertImage(source) {
}

function getHTMLData(withInlineCSS, filterStylesheetName) {
}

function getCSSData(filterStylesheetName) {
}

function getPrintCSSData() {
}

/**
 * Preview Editor HTML data into the editor
 * @param {String} html
 * @param {Boolean} [readOnly] set component into readOnly mode (default: true)
 * @public 
 */
function previewHTML(html, readOnly) {
}

/**
 * Undo Preview Editor HTML data into the editor
 * @param {Boolean} [readOnly] set component into readOnly mode (default: false)
 * @public 
 */
function undoPreviewHTML(readOnly) {
}

/**
 * Return if editor is in preview mode (CKEditor readOnly)
 * @returns boolean
 * @public 
 */
function isInPreviewMode() {
}

/**
 * Request the focus to this editor.
 * @example %%prefix%%%%elementName%%.requestFocus();
 */
function requestFocus() {}