import React from 'react';
import logoImage from '../assets/pharmacy_logo.png';

const Logo = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: '72px',
    medium: '120px',
    large: '180px',
    header: '60px',
  };

    return (
        <div className={`logo-container ${className}`} style={{ textAlign: 'center' }}>
            <img
                src={logoImage}
                alt="Pharma POS Logo"
                style={{
                    width: sizes[size],
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto',
                }}
            />
        </div>
    );
};

export default Logo;
