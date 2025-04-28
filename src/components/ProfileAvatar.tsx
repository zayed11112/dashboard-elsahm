import React, { useState } from 'react';
import { Avatar, Badge, Box, keyframes, styled } from '@mui/material';

// Definición de animaciones
const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(0, 183, 0, 0.7);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 183, 0, 0.9);
  }
  100% {
    box-shadow: 0 0 5px rgba(0, 183, 0, 0.7);
  }
`;

// Badge estilizado con animación
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    animation: `${glow} 1.5s infinite ease-in-out`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: `${ripple} 1.2s infinite ease-in-out`,
      border: '1px solid currentColor',
      content: '""',
    },
  },
}));

// Contenedor para el avatar con efecto hover
const AvatarContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

interface ProfileAvatarProps {
  src: string;
  size?: number;
  onClick?: () => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  src, 
  size = 40,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AvatarContainer
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
      >
        <Avatar
          src={src}
          onClick={onClick}
          sx={{
            width: size,
            height: size,
            border: `2px solid ${isHovered ? '#ffffff' : 'rgba(255,255,255,0.7)'}`,
            transition: 'all 0.3s ease',
            boxShadow: isHovered ? '0 0 15px rgba(255,255,255,0.5)' : '0 0 5px rgba(255,255,255,0.2)',
          }}
        />
      </StyledBadge>
    </AvatarContainer>
  );
};

export default ProfileAvatar;
