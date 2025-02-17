import { ExtensionContext } from "@foxglove/extension";
import { initEmergencyStopPanel } from "./EmergencyStopPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ 
    name: "Emergency Stop", 
    initPanel: initEmergencyStopPanel 
  });
}