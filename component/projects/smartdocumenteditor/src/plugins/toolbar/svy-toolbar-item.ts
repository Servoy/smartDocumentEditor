/**
 * @module SvyToolbarItem/SvyToolbarItem
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { SvyToolbarItemUi } from './svy-toolbar-item-ui';

/**
 * The simple toolbar item plugin. It makes buttons in the toolbar configurable from outside.
 *
 * @extends module:core/plugin~Plugin
 */
export class SvyToolbarItem extends Plugin {

    /**
     * @inheritDoc
     */
    static get requires() {
        return [SvyToolbarItemUi];
    }

    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'svyToolbarItem';
    }

}
