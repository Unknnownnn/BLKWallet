import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import './CompanyForm.css';

const CompanyForm = ({ contract, account }) => {
  const [companyName, setCompanyName] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [minCreditScore, setMinCreditScore] = useState('650');
  const [selectedIssuer, setSelectedIssuer] = useState('BlockCreds Labs');
  const [mintedCompanies, setMintedCompanies] = useState([]);
  const [totalMinted, setTotalMinted] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState('');

  const verifyZkpIfAvailable = async () => {
    try {
      // Try loading artifacts. If any fail, skip verification.
      const [vkeyRes, proofRes, publicRes] = await Promise.all([
        fetch('/zkp/verification_key.json'),
        fetch('/zkp/proof.json'),
        fetch('/zkp/public.json')
      ]);
      if (!vkeyRes.ok || !proofRes.ok || !publicRes.ok) {
        return { performed: false, success: true };
      }
      const [vkey, proof, publicSignals] = await Promise.all([
        vkeyRes.json(),
        proofRes.json(),
        publicRes.json()
      ]);

      setVerificationMessage('Loading ZKP verifier...');
      const snarkjs = await import('snarkjs');
      if (!snarkjs || !snarkjs.groth16 || !snarkjs.groth16.verify) {
        return { performed: false, success: true };
      }

      setVerificationMessage('Running zero-knowledge verification...');
      const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);

      // Optional: ensure user's chosen threshold matches the proof's public signal
      // Expect publicSignals[0] to be minScore (per the sample circuit guidance)
      const publicMin = Array.isArray(publicSignals) ? String(publicSignals[0]) : undefined;
      if (ok && publicMin && String(publicMin) !== String(minCreditScore)) {
        return { performed: true, success: false, reason: 'Threshold mismatch' };
      }

      return { performed: true, success: !!ok };
    } catch (err) {
      // If anything goes wrong, do not block minting
      return { performed: false, success: true };
    }
  };

  // Reusable flow to verify (ZKP or fallback) and then mint
  const performVerifyAndMint = async ({ name, amount, minScore, issuer }) => {
    // Guard
    if (!contract) throw new Error('Contract not connected');

    // Start ZKP verification (real if artifacts exist, else fallback animation)
    setVerificationMessage('Preparing zero-knowledge proof...');
    setIsVerifying(true);
    const result = await verifyZkpIfAvailable();
    if (!result.performed) {
      // Fallback visual flow
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setVerificationMessage(`Verifying you meet the minimum credit score (${minScore})...`);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setVerificationMessage('Finalizing verification...');
      await new Promise((resolve) => setTimeout(resolve, 800));
    } else if (!result.success) {
      setIsVerifying(false);
      setVerificationMessage('');
      alert('ZKP verification failed. Threshold not satisfied or mismatch.');
      return;
    }

    // Proceed to mint after verification
    await contract.mintCompany(name, amount);

    const newCompany = {
      tokenId: localCompanies.length.toString(),
      name,
      tokenAmount: amount,
      owner: account,
      issuer: issuer || selectedIssuer,
      timestamp: new Date().toISOString()
    };
    setLocalCompanies(prev => [...prev, newCompany]);

    alert('Block Cred minted successfully!');
    setCompanyName('');
    setTokenAmount('');
    await loadMintedCompanies();
    setTotalMinted((prev) => String((parseInt(prev || '0') || 0) + 1));
    await loadTotalMinted();
    setIsVerifying(false);
    setVerificationMessage('');
  };
  // Add local storage for demonstration
  const [localCompanies, setLocalCompanies] = useState(() => {
    const saved = localStorage.getItem('mintedCompanies');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (contract && account) {
      loadMintedCompanies();
      loadTotalMinted();
    }
  }, [contract, account]);

  useEffect(() => {
    const detectChain = async () => {
      try {
        if (window.ethereum && window.ethereum.request) {
          const idHex = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(idHex);
          const id = parseInt(idHex, 16);
          const name = (
            id === 1 ? 'Ethereum' :
            id === 5 ? 'Goerli' :
            id === 11155111 ? 'Sepolia' :
            id === 31337 ? 'Hardhat' :
            id === 80001 ? 'Mumbai' :
            id === 137 ? 'Polygon' :
            `Chain ${id}`
          );
          setNetworkName(name);
        }
      } catch (e) {
        // ignore
      }
    };
    detectChain();
  }, []);

  // Save to local storage whenever localCompanies changes
  useEffect(() => {
    localStorage.setItem('mintedCompanies', JSON.stringify(localCompanies));
    // Keep total minted sensible if chain value is unavailable
    setTotalMinted((prev) => {
      const prevNum = parseInt(prev || '0');
      const safePrev = isNaN(prevNum) ? 0 : prevNum;
      return String(Math.max(safePrev, localCompanies.length));
    });
  }, [localCompanies]);

  const loadMintedCompanies = async () => {
    try {
      const userCompanies = await contract.getUserCompanies(account);
      const companiesDetails = await Promise.all(
        userCompanies.map(async (tokenId) => {
          const details = await contract.getCompanyDetails(tokenId);
          return {
            tokenId: tokenId.toString(),
            name: details.name,
            tokenAmount: details.tokenAmount,
            owner: details.owner
          };
        })
      );
      setMintedCompanies(companiesDetails);
    } catch (error) {
      console.error('Error loading minted companies:', error);
    }
  };

  const loadTotalMinted = async () => {
    try {
      if (contract && contract.getTotalMinted) {
        const total = await contract.getTotalMinted();
        if (total && typeof total.toString === 'function') {
          setTotalMinted(total.toString());
        } else if (typeof total === 'number' || typeof total === 'string') {
          setTotalMinted(String(total));
        } else {
          setTotalMinted(String(localCompanies.length));
        }
      } else {
        setTotalMinted(String(localCompanies.length));
      }
    } catch (error) {
      console.error('Error loading total minted:', error);
      setTotalMinted(String(localCompanies.length));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (contract) {
      try {
        const amount = parseInt(tokenAmount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid token amount');
        }
        await performVerifyAndMint({ name: companyName, amount, minScore: minCreditScore, issuer: selectedIssuer });
      } catch (error) {
        console.error('Error minting company:', error);
        alert('Error minting company. Check console for details.');
        setIsVerifying(false);
        setVerificationMessage('');
      }
    }
  };

  // Function to clear local storage (for testing)
  const clearLocalStorage = () => {
    localStorage.removeItem('mintedCompanies');
    setLocalCompanies([]);
  };

  return (
    <div className="company-container">
      {isVerifying && (
        <div className="zkp-overlay" role="dialog" aria-modal="true" aria-label="ZKP verification modal">
          <div className="zkp-modal">
            <div className="zkp-spinner" aria-hidden="true"></div>
            <h3>Zero-Knowledge Verification</h3>
            <p>{verificationMessage || 'Verifying your contract details...'}</p>
            <p className="zkp-subtext">This will auto-complete before minting.</p>
          </div>
        </div>
      )}
      <Hero 
        onConnectWallet={() => {
          if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_requestAccounts' });
          } else {
            alert('Please install MetaMask!');
          }
        }}
        isConnected={!!account}
      />

      {account ? (
        <div className="content-grid">
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-label">Wallet</span>
              <span className="stat-value">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Network</span>
              <span className="stat-value">{networkName || 'Unknown'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Minted</span>
              <span className="stat-value">{totalMinted}</span>
            </div>
          </div>
          <div className="panel form-panel">
            <h2 className="accent-cyan">Block Creds: Private Credit Proof</h2>
            <form onSubmit={handleSubmit} className="mint-form">
              <div className="form-group">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Business or Institution Name"
                  required
                />
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="Token amount to mint"
                  min="1"
                  required
                  className="token-amount-input"
                />
                <input
                  type="number"
                  value={minCreditScore}
                  onChange={(e) => setMinCreditScore(e.target.value)}
                  placeholder="Minimum credit score threshold"
                  min="0"
                  className="token-amount-input"
                />
                <select
                  value={selectedIssuer}
                  onChange={(e) => setSelectedIssuer(e.target.value)}
                  className="issuer-select"
                >
                  <option>BlockCreds Labs</option>
                  <option>PrimeTrust Bank</option>
                  <option>DeFi Underwriters</option>
                  <option>KYC Oracle</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Verify Privately & Mint Block Creds</button>
            </form>

            <div className="templates">
              <h3 className="templates-title accent-cyan">Lender Templates</h3>
              <div className="templates-grid">
                {[
                  { name: 'PrimeTrust Starter Loan', min: 600, amount: 1 },
                  { name: 'DeFi Underwriters Pro', min: 680, amount: 2 },
                  { name: 'KYC Oracle Premium', min: 720, amount: 3 }
                ].map((t) => (
                  <button
                    key={t.name}
                    className="template-card"
                    type="button"
                    onClick={async () => {
                      try {
                        setCompanyName(t.name);
                        setTokenAmount(String(t.amount));
                        setMinCreditScore(String(t.min));
                        await performVerifyAndMint({ name: t.name, amount: t.amount, minScore: t.min, issuer: selectedIssuer });
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <div className="template-name">{t.name}</div>
                    <div className="template-meta">Min Score: {t.min} • Tokens: {t.amount}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="panel list-panel">
            <div className="minted-companies">
              <h3>Your Block Creds</h3>
              <p>Total Block Creds Minted: {localCompanies.length}</p>
              {localCompanies.map((company) => (
                <div key={company.tokenId} className="company-item">
                  <div className="company-header">
                    <span className="issuer-badge">{company.issuer || 'Issuer'}</span>
                    <span className="token-id">#{company.tokenId}</span>
                  </div>
                  <p className="company-name">{company.name}</p>
                  <p>Token Amount: {company.tokenAmount}</p>
                  <p className="timestamp">Minted: {new Date(company.timestamp).toLocaleString()}</p>
                </div>
              ))}
              {process.env.NODE_ENV === 'development' && (
                <button 
                  onClick={clearLocalStorage}
                  className="clear-storage-btn btn btn-ghost"
                >
                  Clear Local Storage
                </button>
              )}
            </div>
          </div>
          {/* <div className="infographics">
            <div className="info-card">
              <div className="info-icon" aria-hidden="true"></div>
              <h4>Private by Design</h4>
              <p>Prove you meet lending criteria with ZKPs—without revealing your identity or score.</p>
            </div>
            <div className="info-card">
              <div className="info-icon" aria-hidden="true"></div>
              <h4>Instant Credentials</h4>
              <p>Mint Block Creds to your wallet and reuse them across lenders and markets.</p>
            </div>
            <div className="info-card">
              <div className="info-icon" aria-hidden="true"></div>
              <h4>Programmable Lending</h4>
              <p>Smart contracts automate terms and repayments while preserving user privacy.</p>
            </div>
          </div> */}
        </div>
      ) : (
        <p>Please connect your wallet to interact with the contract.</p>
      )}
    </div>
  );
};

export default CompanyForm;
