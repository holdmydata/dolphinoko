import React from "react";
import { Card, Badge } from "../common";
// If framer-motion was installed, you would import like this:
// import { motion, AnimatePresence } from "framer-motion";

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
  onClear?: () => void;
  className?: string;
}

const ToolMonitor: React.FC<ToolMonitorProps> = ({
  events,
  isExpanded,
  onToggle,
  onClear,
  className = "",
}) => {
  /* 
   * With framer-motion, we could define animations like this:
   * 
   * const containerVariants = {
   *   expanded: { 
   *     height: 'auto',
   *     opacity: 1,
   *     transition: { duration: 0.3, staggerChildren: 0.1 }
   *   },
   *   collapsed: { 
   *     height: 0,
   *     opacity: 0,
   *     transition: { duration: 0.3 }
   *   }
   * };
   *
   * const itemVariants = {
   *   expanded: { 
   *     opacity: 1, 
   *     y: 0,
   *     transition: { duration: 0.3 }
   *   },
   *   collapsed: { 
   *     opacity: 0, 
   *     y: 10,
   *     transition: { duration: 0.3 }
   *   }
   * };
   */

  return (
    <Card
      className={`${className} transition-all duration-300 overflow-hidden bg-white/90 shadow-sm`}
    >
      {/* 
       * With framer-motion:
       * <motion.div
       *   className="..."
       *   onClick={onToggle}
       *   whileHover={{ backgroundColor: "rgba(242, 228, 201, 0.4)" }}
       *   whileTap={{ scale: 0.98 }}
       * >
       */}
      <div
        className="flex justify-between items-center p-2 cursor-pointer bg-farm-earth-light/30"
        onClick={onToggle}
      >
        <h3 className="text-sm font-medium text-farm-brown-dark">
          Tool Execution Monitor
        </h3>
        <div className="flex items-center">
          {events.length > 0 && (
            <>
              <Badge variant="primary" size="sm" className="mr-2 bg-farm-green text-white">
                {events.length}
              </Badge>
              {onClear && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="mr-2 text-xs text-farm-brown-dark/70 hover:text-farm-brown-dark"
                  title="Clear execution history"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </>
          )}
          {/* 
           * With framer-motion:
           * <motion.svg 
           *   animate={{ rotate: isExpanded ? 180 : 0 }}
           *   transition={{ duration: 0.3 }}
           *   className="w-4 h-4 text-farm-brown"
           * >
           */}
          <svg
            className={`w-4 h-4 transform transition-transform text-farm-brown ${
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

      {/* 
       * With framer-motion:
       * <AnimatePresence>
       *   {isExpanded && (
       *     <motion.div
       *       initial="collapsed"
       *       animate="expanded"
       *       exit="collapsed"
       *       variants={containerVariants}
       *       className="overflow-y-auto border-t border-farm-brown/10"
       *     >
       */}
      {isExpanded && (
        <div className="overflow-y-auto border-t border-farm-brown/10" style={{ maxHeight: isExpanded ? '25vh' : '0' }}>
          {events.length === 0 ? (
            <div className="p-4 text-center text-farm-brown-dark/50">
              No tool executions recorded
            </div>
          ) : (
            <ul className="divide-y divide-farm-brown/10">
              {events.map((event) => (
                /* 
                 * With framer-motion:
                 * <motion.li
                 *   key={event.id}
                 *   variants={itemVariants}
                 *   initial="collapsed"
                 *   animate="expanded"
                 *   exit="collapsed"
                 *   whileHover={{ backgroundColor: "rgba(242, 228, 201, 0.2)" }}
                 *   className="p-3"
                 * >
                 */
                <li key={event.id} className="p-3 hover:bg-farm-earth-light/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-farm-brown-dark">
                        {event.toolName || event.toolId}
                      </div>
                      <div className="text-xs text-farm-brown-dark/70 mt-1">
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
                    <div className="mt-2 text-xs text-farm-brown-dark/80">
                      <span className="font-medium">Processing time:</span>{" "}
                      {event.metrics.processingTime.toFixed(2)}ms
                    </div>
                  )}

                  {event.metrics && event.metrics.tokenCount && (
                    <div className="text-xs text-farm-brown-dark/80">
                      <span className="font-medium">Tokens:</span>{" "}
                      {event.metrics.tokenCount}
                    </div>
                  )}

                  <div className="mt-2">
                    {/* 
                     * With framer-motion, details could be replaced with:
                     * <motion.div className="text-xs">
                     *   <motion.div
                     *     className="cursor-pointer text-farm-green"
                     *     onClick={() => setIsOpen(!isOpen)}
                     *     whileHover={{ color: "#2d6a4f" }}
                     *   >
                     *     Show details
                     *   </motion.div>
                     *   <AnimatePresence>
                     *     {isOpen && (
                     *       <motion.div
                     *         initial={{ height: 0, opacity: 0 }}
                     *         animate={{ height: "auto", opacity: 1 }}
                     *         exit={{ height: 0, opacity: 0 }}
                     *         transition={{ duration: 0.3 }}
                     *       >
                     *         ...content...
                     *       </motion.div>
                     *     )}
                     *   </AnimatePresence>
                     * </motion.div>
                     */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-farm-green hover:text-farm-green-dark">
                        Show details
                      </summary>
                      <div className="mt-2 p-2 bg-farm-earth-light/10 rounded text-farm-brown-dark">
                        <div>
                          <strong>Input:</strong>{" "}
                          {typeof event.input === "string" ? (
                            event.input
                          ) : (
                            <pre className="mt-1 p-2 bg-farm-earth-light/20 rounded text-xs overflow-auto">
                              {JSON.stringify(event.input, null, 2)}
                            </pre>
                          )}
                        </div>
                        <div className="mt-1">
                          <strong>Output:</strong>{" "}
                          {typeof event.output === "string" ? (
                            event.output
                          ) : (
                            <pre className="mt-1 p-2 bg-farm-earth-light/20 rounded text-xs overflow-auto">
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
      {/* With framer-motion: </AnimatePresence> */}
    </Card>
  );
};

export default ToolMonitor;
