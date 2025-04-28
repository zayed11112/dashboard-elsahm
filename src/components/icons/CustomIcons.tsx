import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
import { ReactComponent as PropertySearchSvg } from '../../assets/icons/PropertySearchIcon.svg';
import { ReactComponent as UsersGroupSvg } from '../../assets/icons/UsersGroupIcon.svg';
import { ReactComponent as BookingConfirmSvg } from '../../assets/icons/BookingConfirmIcon.svg';
import { ReactComponent as CommissionSvg } from '../../assets/icons/CommissionIcon.svg';

export const PropertySearchIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} component={PropertySearchSvg} viewBox="0 0 512 512" />
  );
};

export const UsersGroupIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} component={UsersGroupSvg} viewBox="0 0 512 512" />
  );
};

export const BookingConfirmIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} component={BookingConfirmSvg} viewBox="0 0 512 512" />
  );
};

export const CommissionIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} component={CommissionSvg} viewBox="0 0 512 512" />
  );
};
