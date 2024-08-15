import { UAParser } from 'ua-parser-js';

export interface UserAgentDetails {
  userAgentId: string;
  browser: string;
  os: string;
  deviceType: string;
  deviceModel: string;
  deviceVendor: string;
  userAgentSource?: string;
  details?: UAParser.IResult;
}

export function getUserAgentDetails(useragent: string): UserAgentDetails {
  const parser = new UAParser(useragent);
  const result = parser.getResult();
  const temp = {
    browser: result.browser.name || 'unknown',
    os: result.os.name || 'unknown',
    deviceType: result.device.type || 'unknown',
    deviceModel: result.device.model || 'unknown',
    deviceVendor: result.device.vendor || 'unknown',
    userAgentSource: useragent,
    details: result,
  };

  const userAgentId = `${temp.browser}-${temp.os}-${temp.deviceType}-${temp.deviceModel}-${temp.deviceVendor}`;

  return { userAgentId, ...temp };
}
