import React from 'react';
import './Hero.css'; 

const Hero = ({ onConnectWallet, isConnected }) => {
  const benefits = [
    // {
    //   title: "Exclusive Airdrop",
    //   description: "All Priority Pass Holders get access to a good SOUL airdrop"
    // },
    // {
    //   title: "Early Access",
    //   description: "Be amongst the first to claim your SOUL ID and get priority access to solid perks"
    // },
    // {
    //   title: "Mint your Priority Pass",
    //   description: "Enjoy perks such as exclusive WL spots and more from our partners"
    // }
  ];

  return (
    <div className="hero-container">
        <h1 className="hero-title animated-gradient">Prayog Smart Scoring Systems</h1>
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