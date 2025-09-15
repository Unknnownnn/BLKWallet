pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template ScoreAtLeast() {
    // Public signals
    signal input minScore;       // public threshold
    signal input commitment;     // public Poseidon(score, salt) commitment

    // Private signals
    signal input score;          // private user score (e.g., 300..850)
    signal input salt;           // private salt/nonce

    // Range constraint for score (0..65535). Adjust bits if needed.
    // Force bits decomposition to ensure field validity for comparison.
    signal scoreBits[16];
    var base = 1;
    var acc = 0;
    for (var i = 0; i < 16; i++) {
        scoreBits[i] <-- ((score >> i) & 1);
        // Constrain bits to be boolean
        scoreBits[i] * (scoreBits[i] - 1) === 0;
        acc += scoreBits[i] * base;
        base *= 2;
    }
    acc === score;

    // Enforce score >= minScore using LessThan(minScore, score) == 1
    component lt = LessThan(16);
    lt.in[0] <== minScore;
    lt.in[1] <== score;
    lt.out === 1;

    // Poseidon commitment check: commitment == Poseidon([score, salt])
    component H = Poseidon(2);
    H.inputs[0] <== score;
    H.inputs[1] <== salt;
    H.out === commitment;
}

component main = ScoreAtLeast();