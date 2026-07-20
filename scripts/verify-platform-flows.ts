import {
  criticalDesktopFlowsFor,
  supportedDesktopPlatforms,
} from "../src/desktop/platform-flows.js";

for (const platform of supportedDesktopPlatforms) {
  console.log(`${platform}: ${criticalDesktopFlowsFor(platform).join(", ")}`);
}
