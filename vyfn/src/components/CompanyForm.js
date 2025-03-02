import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import './CompanyForm.css';

const CompanyForm = ({ contract, account }) => {
  const [companyName, setCompanyName] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [mintedCompanies, setMintedCompanies] = useState([]);
  const [totalMinted, setTotalMinted] = useState(0);
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

  // Save to local storage whenever localCompanies changes
  useEffect(() => {
    localStorage.setItem('mintedCompanies', JSON.stringify(localCompanies));
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
      const total = await contract.getTotalMinted();
      setTotalMinted(total.toString());
    } catch (error) {
      console.error('Error loading total minted:', error);
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

        await contract.mintCompany(companyName, amount);
        
        // Add to local storage immediately
        const newCompany = {
          tokenId: localCompanies.length.toString(),
          name: companyName,
          tokenAmount: amount,
          owner: account,
          timestamp: new Date().toISOString()
        };
        setLocalCompanies(prev => [...prev, newCompany]);
        
        alert('Company minted successfully!');
        setCompanyName('');
        setTokenAmount('');
        
        // Reload the blockchain state
        await loadMintedCompanies();
        await loadTotalMinted();
      } catch (error) {
        console.error('Error minting company:', error);
        alert('Error minting company. Check console for details.');
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
        <div className="company-details-box">
          <h2>Your Soul ID</h2>
          <form onSubmit={handleSubmit} className="mint-form">
            <div className="form-group">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                required
              />
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="Enter token amount"
                min="1"
                required
                className="token-amount-input"
              />
            </div>
            <button type="submit">Mint your Soul ID</button>
          </form>

          <div className="minted-companies">
            <h3>Your Minted Companies</h3>
            <p>Total Companies Minted: {localCompanies.length}</p>
            
            {/* Show local storage companies */}
            {localCompanies.map((company) => (
              <div key={company.tokenId} className="company-item">
                <p>Token ID: {company.tokenId}</p>
                <p>Name: {company.name}</p>
                <p>Token Amount: {company.tokenAmount}</p>
                <p className="timestamp">Minted: {new Date(company.timestamp).toLocaleString()}</p>
              </div>
            ))}

            {/* Development tools */}
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={clearLocalStorage}
                className="clear-storage-btn"
              >
                Clear Local Storage
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>Please connect your wallet to interact with the contract.</p>
      )}
    </div>
  );
};

export default CompanyForm;
