# ZKP Artifacts

Place your verification artifacts here to enable in-browser verification with snarkjs.

Required files:
- verification_key.json: The Groth16 verification key JSON
- proof.json: The generated proof object
- public.json: The array of public inputs/signals for the proof

Notes:
- The frontend will attempt to fetch these files from `/zkp/` and, if found, run `snarkjs.groth16.verify(vkey, publicSignals, proof)` before minting.
- If the files are missing or invalid, the app will skip ZKP verification and proceed with the existing flow (to avoid breaking functionality).
- To generate artifacts from a Circom circuit, compile with circom, run powers of tau and groth16 setup, then produce witness and proof. Consult snarkjs docs.
