// make_input.js
const fs = require('fs');
const buildPoseidon = require('circomlibjs').buildPoseidon;

async function make(score = 800, salt = 12345, minScore = 750) {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const c = poseidon([BigInt(score), BigInt(salt)]);
  const commitment = F.toString(c);
  const input = {
    minScore: minScore,
    commitment: commitment,
    score: score,
    salt: salt
  };
  fs.writeFileSync('input.json', JSON.stringify(input, null, 2));
  console.log('Wrote input.json with:', input);
}

make();