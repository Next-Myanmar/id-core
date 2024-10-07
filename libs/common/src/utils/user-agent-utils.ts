import { UAParser } from 'ua-parser-js';

export interface UserAgentDetails {
  id: string;
  browser: {
    name: string;
    version: string;
  };
  engine: {
    name: string;
    version: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: string;
    vendor: string;
    model: string;
  };
  cpu: {
    architecture: string;
  };
  ua: string;
}

export function getUserAgentDetails(ua: string): UserAgentDetails {
  const parser = new UAParser(ua);
  const result = parser.getResult();

  const browser = {
    name: result.browser.name || 'unknown',
    version: result.browser.version || 'unknown',
  };

  const engine = {
    name: result.engine.name || 'unknown',
    version: result.engine.name || 'unknown',
  };

  const os = {
    name: result.os.name || 'unknown',
    version: result.os.name || 'unknown',
  };

  const device = {
    type: result.device.type || 'unknown',
    vendor: result.device.vendor || 'unknown',
    model: result.device.model || 'unknown',
  };

  const cpu = {
    architecture: result.cpu.architecture || 'unknown',
  };

  let id = `${browser.name}:${browser.version}`;
  id += `:${engine.name}:${engine.version}`;
  id += `:${os.name}:${os.version}`;
  id += `:${device.type}:${device.vendor}:${device.model}`;
  id += `:${cpu.architecture}`;

  return { id, ua, browser, engine, os, device, cpu };
}
