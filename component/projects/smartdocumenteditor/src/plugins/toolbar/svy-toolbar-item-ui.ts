/**
 * @module SvyToolbarItem/SvyToolbarItemUi
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ViewModel } from '@ckeditor/ckeditor5-ui';
import { View } from '@ckeditor/ckeditor5-ui';
import { addListToDropdown, createDropdown, ListDropdownItemDefinition } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';

export class SvyToolbarItemUi extends Plugin {

	private svyToolbarItems: View[];

    /**
     * @inheritDoc
     */
	init() {

        const editor = this.editor;
		const t = editor.t;
		const itemDefinitions: Array<ItemDefinition> = this.editor.config.get('svyToolbarItems') as Array<ItemDefinition> || [];

		this.svyToolbarItems = [];

		itemDefinitions.forEach(definition => 
			this.createSvyToolbarItem(definition)
		);

		//sync disabled state of editor and toolbar items
		editor.on('change:isReadOnly', () => {
			this.svyToolbarItems.forEach( (button: any) => {
				if (button.ignoreReadOnly !== true) {
					button.isEnabled = !editor.isReadOnly;
				}
			});
		});
	}
	
	createSvyToolbarItem(itemConfig: ItemDefinition) {
		const editor = this.editor;

		if (itemConfig.valueList) {
			editor.ui.componentFactory.add( itemConfig.name, locale => {
                const dropdownView = createDropdown( locale );

                // Populate the list in the dropdown with items.
                addListToDropdown( dropdownView, this.getDropdownItemsDefinitions( itemConfig.valueList ) );

                dropdownView.buttonView.set( {
					label: itemConfig.label,
					withText: itemConfig.withText,
					tooltip: itemConfig.withTooltip
                } );

				dropdownView.set({
					ignoreReadOnly: itemConfig.ignoreReadOnly
				} as any)

                dropdownView.isEnabled = itemConfig.isEnabled;

               // Change enabled state and execute the specific callback on click.
				if (itemConfig.onClick) {
					this.listenTo(dropdownView, 'execute', (evt)  => {
						this.enableButton(dropdownView, false);
						Promise.resolve(itemConfig.onClick(dropdownView, (evt.source as {realValue:any}).realValue)).then(() => this.enableButton(dropdownView, true)).catch(() => this.enableButton(dropdownView, true));
					});
				}
				
                if(itemConfig.iconStyleClass) {
                    dropdownView.buttonView.children.add( this._createIconView(itemConfig.iconStyleClass) );
                }

				//remember buttonView created to allow to sync disabled state of editor
				this.svyToolbarItems.push(dropdownView);

                return dropdownView;
            });
		} else {
			editor.ui.componentFactory.add( itemConfig.name, locale => {
				// The state of the button will be bound to the widget command.
				//const command = editor.commands.get( 'insertSimpleBox' );
	
				// The button will be an instance of ButtonView.
				const buttonView = new ButtonView( locale );
	
				
				buttonView.set( {
					// The t() function helps localize the editor. All strings enclosed in t() can be
					// translated and change when the language of the editor changes.
					label: itemConfig.label,
					withText: itemConfig.withText,
					tooltip: itemConfig.withTooltip,
					ignoreReadOnly: itemConfig.ignoreReadOnly
				} as any);

				buttonView.isEnabled = itemConfig.isEnabled;
	
				// Change enabled state and execute the specific callback on click.
				if (itemConfig.onClick) {
					this.listenTo(buttonView, 'execute', () => {
						this.enableButton(buttonView, false);
						Promise.resolve(itemConfig.onClick(buttonView)).then(() => this.enableButton(buttonView, true)).catch(() => this.enableButton(buttonView, true));
					});
				}
                
                if(itemConfig.iconStyleClass) {
                    buttonView.children.add( this._createIconView(itemConfig.iconStyleClass) );
                }

				//remember buttonView created to allow to sync disabled state of editor
				this.svyToolbarItems.push(buttonView);
	
				return buttonView;
			} );
		}
	}

	getDropdownItemsDefinitions( valueList ): Collection<ListDropdownItemDefinition> {
        const itemDefinitions = new Collection<ListDropdownItemDefinition>();

        if (valueList && valueList.length) {
            valueList.forEach(element => {
                const definition: ListDropdownItemDefinition = {
                    type: 'button',
                    model: new ViewModel( {
                        name: element.displayValue,
                        label: element.displayValue,
                        realValue: element.realValue || element.displayValue,
                        withText: true
                    } )
                };

                // Add the item definition to the collection.
                itemDefinitions.add( definition );
            });
        }

        return itemDefinitions;
	}

    _createIconView( iconClass ) {
		const iconView = new View();
		iconView.setTemplate( {
			tag: 'span',
			attributes: {
				class: 'ckeditor-iconbutton ' + iconClass
			}
		} );

		return iconView;
	}
	/**
     * Enables or disables the button according to the button config
	 * and the current readOnly-state of the editor.
     *
	 * @param button the buttonView
	 * @param value new enabled state
     * @private
     */
	enableButton(button, value) {
        if(button.ignoreReadOnly !== true) {
		    button.isEnabled = !this.editor.isReadOnly && value;
        }
	}
}

interface ItemDefinition {
	onClick(dropdownView: View, realValue?: any): any;
	iconStyleClass: any;
	isEnabled: boolean;
	ignoreReadOnly: boolean;
	withTooltip: string;
	withText: string;
	label: string;
	name: string;
	valueList: any;

}