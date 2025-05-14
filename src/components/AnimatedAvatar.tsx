import React, { useState, useEffect } from 'react';
import { Avatar, Box, keyframes, styled } from '@mui/material';

// Definición de animaciones
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const borderAnimation = keyframes`
  0% {
    border-color: rgba(255, 255, 255, 0.3);
  }
  50% {
    border-color: rgba(255, 255, 255, 0.9);
  }
  100% {
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

// Contenedor animado para el Avatar
const AnimatedContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '50%',
  display: 'inline-block',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: '50%',
    border: '2px solid transparent',
    animation: `${borderAnimation} 3s infinite ease-in-out`,
    zIndex: 0
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: '50%',
    background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 3s infinite linear`,
    zIndex: 0
  }
}));

// Avatar estilizado - rename isHovered to data-hovered to prevent DOM warnings
const StyledAvatar = styled(Avatar)<{ 'data-hovered': boolean }>(({ theme, 'data-hovered': hovered }) => ({
  zIndex: 1,
  transition: 'all 0.3s ease-in-out',
  animation: hovered ? `${pulse} 1.5s infinite` : 'none',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)'
  }
}));

// Círculo giratorio alrededor del avatar
const RotatingCircle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -8,
  left: -8,
  right: -8,
  bottom: -8,
  borderRadius: '50%',
  border: '2px dashed rgba(255, 255, 255, 0.3)',
  animation: `${rotate} 10s linear infinite`,
  zIndex: 0
}));

interface AnimatedAvatarProps {
  src: string;
  alt?: string;
  size?: number;
  onClick?: () => void;
  sx?: any;
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ 
  src, 
  alt = "User Avatar", 
  size = 80,
  onClick,
  sx = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [src]);

  return (
    <AnimatedContainer 
      sx={{ 
        width: size, 
        height: size, 
        mx: 'auto',
        ...sx
      }}
    >
      <RotatingCircle />
      <StyledAvatar
        src={src}
        alt={alt}
        data-hovered={isHovered}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        sx={{
          width: size,
          height: size,
          opacity: isLoaded ? 1 : 0.7,
          transition: 'opacity 0.5s ease-in-out',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      />
    </AnimatedContainer>
  );
};

export default AnimatedAvatar;
