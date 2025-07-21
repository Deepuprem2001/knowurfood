// mlparser.jsx
import levenshtein from 'js-levenshtein';

const KNOWN_LABELS = {
  Fat: ['fat','saturates', 'of which saturates'],
  Carbohydrate: ['carbohydrate', 'carb'],
  Sugar: ['sugar', 'sugars', 'of which sugars'],
  Fibre: ['fibre', 'fiber'],
  Protein: ['protein', 'protien'],
  Salt: ['salt', 'sodium']
};

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function matchNutrient(label) {
  const norm = normalize(label);
  for (const [key, aliases] of Object.entries(KNOWN_LABELS)) {
    for (const alias of aliases) {
      if (levenshtein(norm, alias) <= 2) {
        return key;
      }
    }
  }
  return null;
}

function extractNumber(text) {
  const match = text.match(/([\d.]+)\s*(g|mg)?/i);
  if (match) {
    const num = parseFloat(match[1]);
    if (!isNaN(num) && num < 1000) return num; // reject insane values like 92800
  }
  return null;
}

export function parseNutritionFromText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nutrients = [];

  for (const line of lines) {
    for (const key of Object.keys(KNOWN_LABELS)) {
      if (line.toLowerCase().includes(key.toLowerCase())) {
        const value = extractNumber(line);
        if (value !== null && !nutrients.find(n => n.type === key)) {
          nutrients.push({
            type: key,
            count: value.toFixed(2),
            serving: '1',
            total: value.toFixed(2),
          });
        }
      }
    }
  }

  return nutrients;
}
