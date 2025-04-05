import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';

/**
 * DashboardWorkflow - Documentation page for the complete workflow
 * This page explains how the three dashboard views work together
 * to provide a complete agent development environment.
 */
const DashboardWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren" 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.98 }
  };
  
  // Steps in the workflow
  const workflowSteps = [
    {
      id: 1,
      title: 'Browse & Discover',
      description: 'Explore existing tools and agents to understand what\'s possible and get inspiration.',
      color: 'farm-brown',
      icon: '🧰',
      dashboard: 'Tool Shed Experience',
      route: '/DashboardOption1',
      features: [
        'Browse categorized tools and agents',
        'Search for specific functionality',
        'Try out tools in your workspace',
        'See examples of custom agents created by others',
        'Find templates for common agent types',
      ],
      screenshot: '/assets/images/dashboard1-preview.png'
    },
    {
      id: 2,
      title: 'Create & Develop',
      description: 'Build your own custom tools and agents using Python, Blender integration, and more.',
      color: 'farm-blue',
      icon: '🔧',
      dashboard: 'Developer Workshop',
      route: '/DashboardOption2',
      features: [
        'Connect to external tools like Blender via MCP',
        'Package management and dependency installation',
        'Terminal access for advanced operations',
        'Create Python-based custom tools',
        'Build agent personas with specific capabilities',
        'API connections to external services',
        'Test and debug your creations'
      ],
      screenshot: '/assets/images/dashboard2-preview.png'
    },
    {
      id: 3,
      title: 'Use & Interact',
      description: 'Use your tools and agents in a visual, interactive dashboard for your daily work.',
      color: 'farm-green',
      icon: '🌱',
      dashboard: 'Interactive Dashboard',
      route: '/DashboardOption3',
      features: [
        'Visual card-based UI for all your tools',
        'Interactive agent characters that assist with tasks',
        'Chat with specialized agents for different needs',
        'Customizable workspace layout',
        'Task management with agent assistance',
        'Quickly access your most used tools',
        'Seamless workflow between different tools'
      ],
      screenshot: '/assets/images/dashboard3-preview.png'
    }
  ];
  
  // Complete Scenarios
  const workflowScenarios = [
    {
      id: 'blender-agent',
      title: 'Creating a Blender 3D Agent',
      steps: [
        '1. Start in the Tool Shed to explore existing Blender integrations and templates',
        '2. Move to the Developer Workshop to connect to Blender via MCP',
        '3. Create a new agent character in Blender using the modeling tools',
        '4. Write Python scripts to control the agent\'s behavior',
        '5. Configure the agent\'s personality and knowledge base',
        '6. Test your agent in the Developer Workshop',
        '7. Deploy your finished agent to the Interactive Dashboard',
        '8. Use your custom 3D agent in your daily workflow'
      ]
    },
    {
      id: 'coding-assistant',
      title: 'Building a Programming Assistant Agent',
      steps: [
        '1. Browse the Tool Shed for existing coding tools and templates',
        '2. In the Developer Workshop, install coding-related packages',
        '3. Create Python-based code analysis tools',
        '4. Design a character to represent your coding assistant',
        '5. Connect your assistant to code repositories and documentation',
        '6. Test your assistant with sample coding problems',
        '7. Add your assistant to the Interactive Dashboard',
        '8. Use your assistant to help with your programming tasks'
      ]
    }
  ];
  
  // Getting Started Guide
  const gettingStartedSteps = [
    {
      title: 'Set Up Your Environment',
      description: 'Make sure you have all the necessary services running, including Ollama for LLMs and optionally Blender with MCP plugin.'
    },
    {
      title: 'Explore the Tool Shed',
      description: 'Start by browsing the existing tools to understand what\'s available and get ideas for your own creations.'
    },
    {
      title: 'Connect External Tools',
      description: 'In the Developer Workshop, connect to external tools like Blender that you want to integrate with your agents.'
    },
    {
      title: 'Create Your First Agent',
      description: 'Design a simple agent with a specific purpose, then gradually add more capabilities as you learn.'
    },
    {
      title: 'Test in the Interactive Dashboard',
      description: 'Once your agent is ready, add it to the Interactive Dashboard and test how it works in a real workflow.'
    }
  ];

  return (
    <MainLayout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <motion.h1 
            className="text-4xl font-bold text-farm-brown-dark mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <span className="text-3xl mr-2">🔄</span>
            Complete Agent Development Workflow
            <span className="text-3xl ml-2">🔄</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-4 text-farm-brown max-w-3xl mx-auto">
            Dolphinoko provides an end-to-end environment for exploring, creating, and using AI agents.
            The three dashboard views work together to give you a complete development workflow.
          </motion.p>
        </motion.div>
        
        {/* Workflow Steps */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-farm-brown-dark mb-6 flex items-center">
            <span className="mr-2">🧩</span>
            The Three Phases of Agent Development
          </h2>
          
          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-farm-brown via-farm-blue to-farm-green rounded-full transform -translate-y-1/2"></div>
            
            <div className="relative flex justify-between">
              {workflowSteps.map((step) => (
                <div 
                  key={step.id} 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setActiveStep(step.id)}
                >
                  <motion.div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white z-10 border-4 border-white text-xl ${
                      activeStep === step.id ? `bg-${step.color}` : `bg-${step.color}-light/70`
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    animate={activeStep === step.id ? { scale: [1, 1.1, 1], transition: { repeat: 0 } } : {}}
                  >
                    {step.icon}
                  </motion.div>
                  <div className="mt-2 text-center">
                    <div className={`font-bold text-${step.color}-dark`}>{step.title}</div>
                    <div className={`text-xs text-${step.color}-dark/70`}>{step.dashboard}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Active Step Details */}
          {workflowSteps.map((step) => (
            activeStep === step.id && (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-6 border-2 border-${step.color} rounded-xl bg-${step.color}-light/10`}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/2">
                    <h3 className={`text-xl font-bold text-${step.color}-dark mb-2 flex items-center`}>
                      <span className="mr-2">{step.icon}</span>
                      {step.title}: {step.dashboard}
                    </h3>
                    <p className="text-farm-brown mb-4">{step.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-farm-brown-dark mb-2">Key Features:</h4>
                      <ul className="space-y-1">
                        {step.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className={`text-${step.color} mr-2`}>•</span>
                            <span className="text-farm-brown">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link 
                      to={step.route} 
                      className={`inline-block mt-2 px-4 py-2 bg-${step.color} hover:bg-${step.color}-dark text-white rounded-md transition-colors`}
                    >
                      Go to {step.dashboard}
                    </Link>
                  </div>
                  
                  <div className="md:w-1/2 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center">
                    <div className={`w-full h-64 bg-${step.color}-light/30 rounded flex items-center justify-center`}>
                      <div className="text-6xl">{step.icon}</div>
                      <div className="text-sm text-gray-500 mt-2">Dashboard Preview</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </motion.div>
        
        {/* Complete Workflow Scenarios */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-farm-brown-dark mb-6 flex items-center">
            <span className="mr-2">🔄</span>
            Complete Workflow Scenarios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workflowScenarios.map(scenario => (
              <motion.div 
                key={scenario.id}
                variants={itemVariants}
                whileHover="hover"
                className="farm-panel"
              >
                <div className="farm-panel-title">
                  {scenario.id === 'blender-agent' ? '📐' : '💻'} {scenario.title}
                </div>
                <div className="farm-panel-content p-4">
                  <ol className="space-y-2 text-farm-brown">
                    {scenario.steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-farm-brown-dark font-medium mr-2">{index+1}.</span>
                        <span>{step.substring(step.indexOf(' ') + 1)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Getting Started Guide */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-2xl font-bold text-farm-brown-dark mb-6 flex items-center">
            <span className="mr-2">🚀</span>
            Getting Started
          </h2>
          
          <div className="relative pl-8 border-l-2 border-farm-green">
            {gettingStartedSteps.map((step, index) => (
              <motion.div 
                key={index}
                className="mb-8 relative"
                variants={itemVariants}
              >
                <div className="absolute -left-10 w-8 h-8 rounded-full bg-farm-green text-white flex items-center justify-center">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-farm-brown-dark mb-2">{step.title}</h3>
                <p className="text-farm-brown">{step.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link 
              to="/" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-farm-brown via-farm-blue to-farm-green text-white rounded-full shadow-md"
            >
              <span className="mr-2">🏡</span>
              Return to Dashboard Selection
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
};

export default DashboardWorkflow; 