const { program } = require('commander');
const fs = require('fs');

program
  .requiredOption('-i, --input <path>', 'path to input JSON file')
  .option('-o, --output <path>', 'path to output file')
  .option('-d, --display', 'display result in console')
  .option('--date', 'display date before flight information')
  .option('-a, --airtime <minutes>', 'filter flights with air time longer than specified', parseInt);

program.parse(process.argv);

const options = program.opts();

if (!options.input) {
  console.error('Please, specify input file');
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

let data = [];
try {
  const fileContent = fs.readFileSync(options.input, 'utf8');
  const lines = fileContent.trim().split('\n');

  lines.forEach((line, index) => {
    // Ігноруємо Git-конфлікти або пусті рядки
    if (!line.trim() || line.startsWith('<<<<<<<') || line.startsWith('=======') || line.startsWith('>>>>>>>')) {
      return;
    }

    try {
      data.push(JSON.parse(line));
    } catch (err) {
      console.warn(`Skipping invalid JSON on line ${index + 1}: ${err.message}`);
    }
  });

} catch (error) {
  console.error('Error reading input file:', error.message);
  process.exit(1);
}

let result = [];

data.forEach(flight => {
  if (options.airtime && flight.AIR_TIME <= options.airtime) {
    return;
  }

  let line = '';
  
  if (options.date && flight.FL_DATE) {
    line += flight.FL_DATE + ' ';
  }
  
  line += (flight.AIR_TIME || 'N/A') + ' ' + (flight.DISTANCE || 'N/A');
  
  result.push(line);
});

const output = result.join('\n');

const shouldOutput = options.output || options.display;

if (!shouldOutput) {
  process.exit(0);
}

if (options.display) {
  console.log(output);
}

if (options.output) {
  try {
    fs.writeFileSync(options.output, output, 'utf8');
  } catch (error) {
    console.error('Error writing output file:', error.message);
    process.exit(1);
  }
}
