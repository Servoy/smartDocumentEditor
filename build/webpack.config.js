/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

'use strict';

/* eslint-env node */

const path = require( 'path' );
const webpack = require( 'webpack' );
const { bundler, styles } = require( '@ckeditor/ckeditor5-dev-utils' );
const CKEditorWebpackPlugin = require( '@ckeditor/ckeditor5-dev-webpack-plugin' );
const { DuplicatesPlugin } = require("inspectpack/plugin");
const FileManagerPlugin = require('filemanager-webpack-plugin');
const WrapCkeditorPlugin = require('./webpack/wrap-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	performance: { hints: false },

	entry: path.resolve( __dirname, 'src', 'ckeditor.js' ),

	output: {
		// The name under which the editor will be exported.
		library: 'DecoupledEditor',

		path: path.resolve( __dirname, 'build' ),
		filename: 'ckeditor.js',
		libraryTarget: 'umd',
		libraryExport: 'default'
	},

	plugins: [
		new CKEditorWebpackPlugin( {
			// UI language. Language codes follow the https://en.wikipedia.org/wiki/ISO_639-1 format.
			// When changing the built-in language, remember to also change it in the editor's configuration (src/ckeditor.js).
			language: 'en',
			additionalLanguages: 'all',
            buildAllTranslationsToSeparateFiles: true
		} ),
		new webpack.BannerPlugin( {
			banner: bundler.getLicenseBanner(),
			raw: true
		} ),
        new DuplicatesPlugin({
            // Emit compilation warning or error? (Default: `false`)
            emitErrors: false,
            // Display full duplicates information? (Default: `false`)
            verbose: false
          }),
        new WrapCkeditorPlugin(),
        new MiniCssExtractPlugin({
            filename: 'ckeditorStyle.css', // Output filename for the CSS files
            chunkFilename: 'ckeditorStyle.css',
          }),
        new FileManagerPlugin({
            events: {
              onEnd: {
                copy: [
                    { source: "build/translations/*.js", destination: "../component/projects/smartdocumenteditor/assets/lib/translations", options: {overwrite: true} },
                    { source: "build/*.js", destination: "../component/projects/smartdocumenteditor/src/assets/lib", options: {overwrite: true} },
                    { source: "build/*.css", destination: "../component/projects/smartdocumenteditor/assets", options: {overwrite: true} }
                ]
              }
            }
        })
	],

	module: {
		rules: [
			{
                test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
                use: [ 'raw-loader' ]
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader',{
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: styles.getPostCssConfig( {
                            themeImporter: {
                                themePath: require.resolve( '@ckeditor/ckeditor5-theme-lark' )
                            },
                            minify: true
                        } )
                    }
                }]
              }
		]
	},

    resolve: {
        alias: {
          '@ckeditor/ckeditor5-core': path.resolve(__dirname,'node_modules/@ckeditor/ckeditor5-core'),
          '@ckeditor/ckeditor5-ui': path.resolve(__dirname,'node_modules/@ckeditor/ckeditor5-ui'),
          '@ckeditor/ckeditor5-widget': path.resolve(__dirname,'node_modules/@ckeditor/ckeditor5-widget'),
          '@ckeditor/ckeditor5-utils': path.resolve(__dirname,'node_modules/@ckeditor/ckeditor5-utils')
      }
    }
};
