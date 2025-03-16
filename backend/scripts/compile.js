
const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, '../contracts/build');
const contractPath = path.resolve(__dirname, '../contracts/ComplaintRegistry.sol');

// Ensure build directory exists
fs.ensureDirSync(buildPath);

// Read the Contract
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'ComplaintRegistry.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
fs.outputJsonSync(
  path.resolve(buildPath, 'ComplaintRegistry.json'),
  output.contracts['ComplaintRegistry.sol'].ComplaintRegistry
);
