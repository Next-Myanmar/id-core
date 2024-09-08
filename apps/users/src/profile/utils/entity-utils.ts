import { Gender } from '../../enums/gender.enum';
import { Device, LoginHistory, User } from '../../prisma/generated';
import { DeviceEntity } from '../entities/device.entity';
import { LoginHistoryEntity } from '../entities/login-history.entity';
import { PersonalDetailsEntity } from '../entities/personal-details.entity';

export function convertToUserEntity(user: User): PersonalDetailsEntity {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName ? user.lastName : undefined,
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISODateString()
      : undefined,
    gender: user.gender ? (user.gender as Gender) : undefined,
  };
}

export function convertToLoginHistoryEntity(
  loginHistory: LoginHistory,
): LoginHistoryEntity {
  return {
    lastLogin: loginHistory.lastLogin,
    country: loginHistory.country,
    subDivision1: loginHistory.subDivision1,
    subDivision2: loginHistory.subDivision2,
    city: loginHistory.city,
  };
}

export function convertToDeviceEntity(
  device: Device & { loginHistories: LoginHistory[] },
  currentDeviceId: string,
): DeviceEntity {
  const temp = {
    id: device.id,
    browser: device.browser,
    os: device.os,
    deviceType: device.deviceType,
    deviceModel: device.deviceModel,
    deviceVendor: device.deviceVendor,
    lastLogin: convertToLoginHistoryEntity(device.loginHistories[0]),
  };

  const isCurrentDevice = device.id === currentDeviceId;

  return {
    ...temp,
    isCurrentDevice,
  };
}
