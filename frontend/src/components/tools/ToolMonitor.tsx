import React from "react";
import { Card, Badge } from "../common";

export interface ToolExecutionEvent {
  id: string;
  toolId: string;
  toolName: string;
  input: string | Record<string, any>;
  output: string | Record<string, any>;
  startTime: Date;
  endTime?: Date;
  status: "pending" | "success" | "error";
  metrics: {
    processingTime?: number;
    tokenCount?: number;
    [key: string]: any;
  };
}

interface ToolMonitorProps {
  events: ToolExecutionEvent[];
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

const ToolMonitor: React.FC<ToolMonitorProps> = ({
  events,
  isExpanded,
  onToggle,
  className = "",
}) => {
  return (
    <Card
      className={`${className} transition-all duration-300 overflow-hidden`}
    >
      <div
        className="flex justify-between items-center p-2 cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Tool Execution Monitor
        </h3>
        <div className="flex items-center">
          {events.length > 0 && (
            <Badge variant="primary" size="sm" className="mr-2">
              {events.length}
            </Badge>
          )}
          <svg
            className={`w-4 h-4 transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-60 overflow-y-auto border-t">
          {events.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No tool executions recorded
            </div>
          ) : (
            <ul className="divide-y">
              {events.map((event) => (
                <li key={event.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium dark:text-gray-100 text-gray-900">
                        {event.toolName || event.toolId}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(event.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge
                      variant={
                        event.status === "success"
                          ? "success"
                          : event.status === "error"
                          ? "danger"
                          : "warning"
                      }
                      size="sm"
                    >
                      {event.status}
                    </Badge>
                  </div>

                  {event.metrics && event.metrics.processingTime && (
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Processing time:</span>{" "}
                      {event.metrics.processingTime.toFixed(2)}ms
                    </div>
                  )}

                  {event.metrics && event.metrics.tokenCount && (
                    <div className="text-xs">
                      <span className="font-medium">Tokens:</span>{" "}
                      {event.metrics.tokenCount}
                    </div>
                  )}

                  <div className="mt-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600">
                        Show details
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700">
                        <div>
                          <strong>Input:</strong>{" "}
                          {typeof event.input === "string" ? (
                            event.input
                          ) : (
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify(event.input, null, 2)}
                            </pre>
                          )}
                        </div>
                        <div className="mt-1">
                          <strong>Output:</strong>{" "}
                          {typeof event.output === "string" ? (
                            event.output
                          ) : (
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify(event.output, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
};

export default ToolMonitor;
