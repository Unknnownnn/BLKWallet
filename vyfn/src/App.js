import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import CompanyForm from './components/CompanyForm';
import BoxABI from './Box.json';
import './App.css';

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

function App() {
  const [account, setAccount] = useState(null);
  const [boxContract, setBoxContract] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new BrowserProvider(window.ethereum);
          setProvider(provider);

          const accounts = await provider.send('eth_requestAccounts', []);
          setAccount(accounts[0]);

          const signer = await provider.getSigner();
          const contract = new Contract(contractAddress, BoxABI.abi, signer);
          setBoxContract(contract);
        } catch (error) {
          console.error('Failed to connect to wallet:', error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };

    connectWallet();
  }, []);

  return (
    <div className="App">
      <CompanyForm contract={boxContract} account={account} />
    </div>
  );
}

export default App;

