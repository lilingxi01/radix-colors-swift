import * as radixColors from '@radix-ui/colors';
import fs from 'fs';
import { helperExtensions } from './helper';
import { headerComment } from './header-comment';

/**
 * This function takes a color string (the value of each Radix Color) and convert it to Swift Color.
 * @param colorString - The value of a Radix Color
 * @return - A script of Swift Color in Swift.
 */
function parseColorString(colorString: string): string {
  // Remove prefix and suffix.
  let parsedString = colorString
    .replace('hsl(', '')
    .replace('hsla(', '')
    .replace(')', '');

  // Remove percentage sign.
  while (parsedString.indexOf('%') !== -1) {
    parsedString = parsedString.replace('%', '');
  }

  // Remove white space.
  while (parsedString.indexOf(' ') !== -1) {
    parsedString = parsedString.replace(' ', '');
  }

  // Split the string into an array.
  const parts = parsedString.split(',');
  const h = Number(parts[0]);
  const s = Number(parts[1]) / 100;
  const l = Number(parts[2]) / 100;
  if (parts.length === 4) {
    const a = Number(parts[3]);
    return `Color(h: ${h}, s: ${s.toFixed(3)}, l: ${l.toFixed(3)}, a: ${a.toFixed(3)})`;
  }
  return `Color(h: ${h}, s: ${s.toFixed(3)}, l: ${l.toFixed(3)})`;
}

const outputDir = 'output';
const outputFile = 'RadixColors.swift';

function main() {
  // Create the output directory if it does not exist.
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Create a file stream to write the output.
  const logger = fs.createWriteStream(outputDir + '/' + outputFile, {
    // do not keep old text.
    flags: 'w',
  });

  // Get all entries from Radix Colors library.
  const radixEntries = Object.entries(radixColors);

  // Write the header comment.
  logger.write(headerComment + '\n');

  // Write the header of the file.
  logger.write('import SwiftUI\n\n');

  // Write the main class.
  logger.write('/// [Radix Colors] A gorgeous, accessible color system.\n');
  logger.write('final class RadixColor {\n');
  for (const [name, colors] of radixEntries) {
    const isDarkClass = name.endsWith('Dark') || name.endsWith('DarkA');
    logger.write(`    /// [Radix Colors] Collection: ${name}\n`);
    logger.write('    class ' + name + ' {\n');
    for (const [colorName, color] of Object.entries(colors)) {
      logger.write(`        /// [Radix Color] ${colorName}` + (isDarkClass ? ' (Dark)\n' : '\n'));
      logger.write('        static let ' + colorName + ': Color = ' + parseColorString(color) + '\n');
    }
    logger.write('    }\n');
  }
  logger.write('}\n\n');

  // Write the Color extension using UIColor (for iOS).
  logger.write('#if canImport(UIKit)\n');
  logger.write('extension Color {\n');
  const colorExtensionEntries = radixEntries.filter(([name]) => !name.endsWith('Dark') && !name.endsWith('DarkA'));
  for (const [name, colors] of colorExtensionEntries) {
    const isTransparent = name.endsWith('A');
    const themeName = name.replace('A', '');
    const pascalCaseThemeName = themeName[0].toUpperCase() + themeName.slice(1);
    const lightThemeName = name;
    const darkThemeName = isTransparent ? themeName + 'DarkA' : themeName + 'Dark';
    const colorNames = Object.keys(colors);
    // Extract the color name from the class name.
    for (const colorName of colorNames) {
      // Add a comment for each color.
      logger.write(`    /// [Radix Color] ${pascalCaseThemeName} - ${colorName} (dynamic color for iOS)\n`);
      // Write the color variable.
      if (themeName === 'white' || themeName === 'black') {
        logger.write('    static let ' + colorName + ': Color = RadixColor.' + name + '.' + colorName + '\n');
      } else {
        logger.write('    static let ' + colorName + ': Color = Color(light: RadixColor.' + lightThemeName + '.' + colorName + ', dark: RadixColor.' + darkThemeName + '.' + colorName + ')\n');
      }
      if (colorName !== colorNames[colorNames.length - 1]) {
        logger.write('\n');
      }
    }
    // Only create line break if there are more colors.
    if (colorExtensionEntries[colorExtensionEntries.length - 1][0] !== name) {
      logger.write('\n');
    }
  }
  logger.write('}\n');
  logger.write('#endif\n');

  // TODO: Write the Color extension (for macOS).

  // Write the global helper extensions.
  logger.write(helperExtensions);

  logger.end();
  console.log('Done.');
}

main();
