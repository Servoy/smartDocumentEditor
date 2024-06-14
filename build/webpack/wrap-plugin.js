const fs = require('fs');
const path = require('path');
const startContent = `function wrap(func) {
var module = {exports: {}};
var exports = module.exports;

`;
const endContent = `

return module.exports;
}
export default wrap();
`;

class WrapCkeditorPlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tap('WrapCkeditorPlugin', (compilation) => {
            const filePath = path.join(compiler.options.output.path, 'ckeditor.js');

            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    return;
                }

               const modifiedContent = startContent + data + endContent;

               fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
                   if (err) {
                       console.error('Error writing file:', err);
                       return;
                   }
                   console.log('ckeditor.js file modified successfully!');
               });
           });
       });
   }
}

module.exports = WrapCkeditorPlugin;