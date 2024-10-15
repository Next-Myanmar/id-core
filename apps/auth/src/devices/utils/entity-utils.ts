import { getUserAgentDetails, UserAgentDetails } from '@app/common';
import { Device, LoginHistory } from '@app/prisma/auth';
import { DeviceEntity } from '../entities/device.entity';
import { GeoipEntity } from '../entities/geoip.entity';
import { LoginHistoryEntity } from '../entities/login-history.entity';

export function convertToDeviceEntity(
  device: Device & { loginHistories: LoginHistory[] },
  currentDeviceId: string,
): DeviceEntity {
  const userAgentDetails = getUserAgentDetails(device.ua);
  return {
    ...userAgentDetails,
    id: device.id,
    name: getDeviceName(userAgentDetails),
    isCurrentDevice: device.id === currentDeviceId,
    lastLogin: convertToLoginHistoryEntity(device.loginHistories[0]),
  };
}

export function getDeviceName(userAgentDetails: UserAgentDetails): string {
  const deviceNameParts = [];

  if (userAgentDetails.browser.name !== 'unknown') {
    deviceNameParts.push(userAgentDetails.browser.name);
  }

  if (userAgentDetails.device.type !== 'unknown') {
    deviceNameParts.push(userAgentDetails.device.model);
  } else if (userAgentDetails.os.name !== 'unknown') {
    deviceNameParts.push(userAgentDetails.os.name);
  }

  if (deviceNameParts.length > 0) {
    return deviceNameParts.join(', ');
  }

  return 'Unknown Device';
}

export function convertToLoginHistoryEntity(
  loginHistory: LoginHistory,
): LoginHistoryEntity {
  const geoip = convertToGeoipEntity(loginHistory);

  return { ...geoip, lastLogin: loginHistory.lastLogin };
}

export function convertToGeoipEntity(loginHistory: LoginHistory): GeoipEntity {
  const locationParts = [
    loginHistory.subDivision2,
    loginHistory.subDivision1,
    loginHistory.city,
    loginHistory.country,
  ].filter(Boolean);

  return {
    name: locationParts.join(', '),
    country: loginHistory.country,
    subDivision1: loginHistory.subDivision1,
    subDivision2: loginHistory.subDivision2,
    city: loginHistory.city,
  };
}
