import React from 'react';
import './Hero.css'; 

const Hero = ({ onConnectWallet, isConnected }) => {
  const benefits = [

  ];

  return (
    <div className="hero-container">
        <h1 className="hero-title animated-gradient">Block Creds</h1>
        {!isConnected && (
          <button className="connect-button" onClick={onConnectWallet}>
            Connect Wallet
          </button>
        )}
      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <div key={index} className="benefit-card">
            <h3>{benefit.title}</h3>
            <p className="benefit-description">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hero;