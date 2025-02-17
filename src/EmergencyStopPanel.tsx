import { PanelExtensionContext, SettingsTreeNodes } from "@foxglove/extension";
import { useCallback, useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";

type Config = {
  topicName: string;
};

function buildSettingsTree(config: Config): SettingsTreeNodes {
  return {
    general: {
      label: "General",
      fields: {
        topicName: {
          label: "Topic Name",
          input: "string",
          value: config.topicName || "/is_emergency_stopped",
        },
      },
    },
  };
}

function EmergencyStopPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [isEmergency, setIsEmergency] = useState(false);
  const publishIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [config, setConfig] = useState<Config>(() => {
    const savedConfig = context.initialState as Partial<Config>;
    return {
      topicName: savedConfig.topicName ?? "/is_emergency_stopped",
    };
  });

  useEffect(() => {
    context.updatePanelSettingsEditor({
      nodes: buildSettingsTree(config),
      actionHandler: (action) => {
        if (action.action !== "update") {
          return;
        }

        const path = action.payload.path;
        if (path[0] === "general" && path[1] === "topicName") {
          const newValue = action.payload.value;
          if (typeof newValue === "string") {
            setConfig((prev) => ({
              ...prev,
              topicName: newValue,
            }));
          }
        }
      },
    });

    context.saveState(config);
  }, [config, context]);

  useEffect(() => {
    if (publishIntervalRef.current) {
      clearInterval(publishIntervalRef.current);
    }

    context.advertise?.(config.topicName, "std_msgs/Bool");

    publishIntervalRef.current = setInterval(() => {
      context.publish?.(config.topicName, {
        data: isEmergency
      });
    }, 100);

    return () => {
      if (publishIntervalRef.current) {
        clearInterval(publishIntervalRef.current);
      }
    };
  }, [context, isEmergency, config.topicName]);

  const handleEmergencyStop = useCallback(() => {
    setIsEmergency(true);
  }, []);

  const handleEmergencyRelease = useCallback(() => {
    setIsEmergency(false);
  }, []);

  return (
    <div style={{ 
      padding: "1rem", 
      width: "100%", 
      height: "100%",
      backgroundColor: "#FFEB3B"
    }}>
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem"
      }}>
        <button
          onClick={handleEmergencyStop}
          style={{
            width: "150px",
            height: "150px",
            backgroundColor: isEmergency ? "#8B0000" : "#FF0000",
            color: "white",
            border: "none",
            borderRadius: "75px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
          }}
        >
          EMERGENCY STOP
        </button>
        {isEmergency && (
          <div>
            <button
              onClick={handleEmergencyRelease}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Release Emergency Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function initEmergencyStopPanel(context: PanelExtensionContext): () => void {
  ReactDOM.render(<EmergencyStopPanel context={context} />, context.panelElement);

  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}