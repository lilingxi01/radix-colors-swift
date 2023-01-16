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
    return `Color(hue: ${h}, saturation: ${s.toFixed(3)}, brightness: ${l.toFixed(3)}, opacity: ${a.toFixed(3)})`;
  }
  return `Color(hue: ${h}, saturation: ${s.toFixed(3)}, brightness: ${l.toFixed(3)})`;
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
  logger.write('final class RadixColor {\n');
  for (const [name, colors] of radixEntries) {
    logger.write('    class ' + name + ' {\n');
    for (const [colorName, color] of Object.entries(colors)) {
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
    const lightThemeName = name;
    const darkThemeName = isTransparent ? themeName + 'DarkA' : themeName + 'Dark';
    // Extract the color name from the class name.
    for (const colorName of Object.keys(colors)) {
      if (themeName === 'white' || themeName === 'black') {
        logger.write('    static let ' + colorName + ': Color = RadixColor.' + name + '.' + colorName + '\n');
      } else {
        logger.write('    static let ' + colorName + ': Color = Color(light: RadixColor.' + lightThemeName + '.' + colorName + ', dark: RadixColor.' + darkThemeName + '.' + colorName + ')\n');
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
