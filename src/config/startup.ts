import {
  type ServiceConfiguration,
  type ServiceEnvironment,
  validateServiceConfiguration,
} from "./services.js";

export function validateDesktopStartupConfiguration(
  environment: ServiceEnvironment = process.env,
): ServiceConfiguration {
  return validateServiceConfiguration(environment);
}
