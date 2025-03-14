import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "../components/common";
import { ToolExecutionEvent } from "../components/tools/ToolMonitor";
import {
  getStoredEvents,
  clearStoredEvents,
} from "../utils/toolMonitoringStorage";

const ToolMonitoring: React.FC = () => {
  const [events, setEvents] = useState<ToolExecutionEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<ToolExecutionEvent | null>(
    null
  );
  const [showModal, setShowModal] = useState<boolean>(false);

  // Load events from storage
  useEffect(() => {
    const storedEvents = getStoredEvents();
    setEvents(storedEvents);
    setLoading(false);
  }, []);

  // Statistics calculation
  const calculateStats = () => {
    if (events.length === 0) return null;

    const successEvents = events.filter((e) => e.status === "success");
    const errorEvents = events.filter((e) => e.status === "error");
    const averageProcessingTime =
      successEvents.reduce(
        (sum, event) => sum + (event.metrics.processingTime || 0),
        0
      ) / (successEvents.length || 1);

    // Group by tool name
    const toolCounts: Record<string, number> = {};
    events.forEach((e) => {
      toolCounts[e.toolName] = (toolCounts[e.toolName] || 0) + 1;
    });

    // Find most used tool
    let mostUsedTool = { name: "", count: 0 };
    Object.entries(toolCounts).forEach(([name, count]) => {
      if (count > mostUsedTool.count) {
        mostUsedTool = { name, count };
      }
    });

    return {
      totalEvents: events.length,
      successCount: successEvents.length,
      errorCount: errorEvents.length,
      successRate: (successEvents.length / events.length) * 100,
      averageProcessingTime,
      mostUsedTool: mostUsedTool.name
        ? `${mostUsedTool.name} (${mostUsedTool.count})`
        : "None",
    };
  };

  const stats = calculateStats();

  // Clear all events
  const handleClearEvents = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all tool execution history?"
      )
    ) {
      clearStoredEvents();
      setEvents([]);
    }
  };

  // View event details
  const viewEventDetails = (event: ToolExecutionEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Tool Monitoring
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor AI tool executions and performance metrics
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Executions
            </h3>
            <p className="text-2xl text-gray-600 dark:text-gray-200 font-bold mt-1">
              {stats.totalEvents}
            </p>
            <div className="mt-2 text-xs  text-gray-500 dark:text-gray-400">
              <span className="text-green-500">
                {stats.successCount} successful
              </span>{" "}
              /
              <span className="text-red-500 ml-1">
                {stats.errorCount} failed
              </span>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Success Rate
            </h3>
            <p className="text-2xl text-gray-600 dark:text-gray-200 font-bold mt-1">
              {stats.successRate.toFixed(1)}%
            </p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Most used: {stats.mostUsedTool}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Avg. Processing Time
            </h3>
            <p className="text-2xl  text-gray-600 dark:text-gray-200 font-bold mt-1">
              {stats.averageProcessingTime.toFixed(0)} ms
            </p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              For successful executions only
            </div>
          </Card>
        </div>
      )}

      {/* Execution History */}
      <Card className="overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg text-gray-600 dark:text-gray-200 font-medium">
            Execution History
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearEvents}
            disabled={events.length === 0}
          >
            Clear History
          </Button>
        </div>

        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No execution history available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tool
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Processing Time
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {event.toolName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {event.startTime.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {event.metrics.processingTime
                        ? `${event.metrics.processingTime.toFixed(0)} ms`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewEventDetails(event)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900  rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg text-gray-600 dark:text-gray-200 font-medium">
                {selectedEvent.toolName} Execution Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Basic Info */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tool ID
                    </p>
                    <p className="font-medium text-gray-600 dark:text-gray-200">
                      {selectedEvent.toolId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <p>
                      <Badge
                        variant={
                          selectedEvent.status === "success"
                            ? "success"
                            : selectedEvent.status === "error"
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                      >
                        {selectedEvent.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start Time
                    </p>
                    <p className="font-medium text-gray-600 dark:text-gray-200">
                      {selectedEvent.startTime.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      End Time
                    </p>
                    <p className="font-medium text-gray-600 dark:text-gray-200">
                      {selectedEvent.endTime
                        ? selectedEvent.endTime.toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="mb-6">
                <h4 className="text-md  text-gray-200 dark:text-white font-medium mb-2">
                  Metrics
                </h4>
                <Card className="p-4 bg-gray-50 dark:bg-gray-950">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedEvent.metrics).map(
                      ([key, value]) => (
                        <div key={key}>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {key}
                          </p>
                          <p className="font-medium text-gray-600 dark:text-gray-200">
                            {typeof value === "number"
                              ? key.includes("time") || key.includes("duration")
                                ? `${(
                                    value / (key.includes("duration") ? 1e9 : 1)
                                  ).toFixed(2)} ${
                                    key.includes("duration") ? "s" : "ms"
                                  }`
                                : value.toString()
                              : typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </Card>
              </div>

              {/* Input/Output */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-md text-gray-600 dark:text-gray-200 font-medium mb-2">
                    Input
                  </h4>
                  <div className="border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedEvent.input}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-md text-gray-600 dark:text-gray-200 font-medium mb-2">
                    Output
                  </h4>
                  <div className="border rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedEvent.output}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolMonitoring;
