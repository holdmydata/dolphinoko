import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Auto redirect is disabled to show landing page
    // router.push('/dashboard') 
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-kawaii-purple-50 to-kawaii-pink-50">
      {/* Header */}
      <header className="py-4 px-6 bg-white/70 backdrop-blur-md shadow-sm border-b border-white/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-pixel text-kawaii-purple-800">🌱 Dolphinoko</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/farm-home" className="text-kawaii-purple-700 hover:text-kawaii-purple-900 font-medium">
              Farm Home
            </Link>
            <Link href="/character-creator" className="text-kawaii-purple-700 hover:text-kawaii-purple-900 font-medium">
              Character Creator
            </Link>
            <Link href="/toolshed" className="text-kawaii-purple-700 hover:text-kawaii-purple-900 font-medium">
              Tool Shed
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col md:flex-row items-center justify-center p-6 md:p-12 max-w-7xl mx-auto">
        <motion.div 
          className="md:w-1/2 text-center md:text-left mb-8 md:mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold text-kawaii-purple-900 mb-4 font-pixel">
            Your Kawaii Farm Adventure
          </h1>
          <p className="text-lg text-kawaii-purple-700 mb-8 max-w-xl">
            Welcome to Dolphinoko, where AI assistants come to life as cute farm animals ready to help with your tasks!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/farm-home" 
                className="px-6 py-3 bg-gradient-to-r from-kawaii-purple-500 to-kawaii-pink-500 text-white rounded-full font-medium shadow-md inline-block"
              >
                Visit Farm
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/character-creator" 
                className="px-6 py-3 bg-white/80 backdrop-blur-md text-kawaii-purple-700 rounded-full font-medium shadow-sm border border-white/30 inline-block"
              >
                Create Character
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          className="md:w-1/2 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <div className="w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-r from-kawaii-purple-200 to-kawaii-pink-200 rounded-full mx-auto relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Farm Animals */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="text-8xl">🐱</div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.7, ease: "easeInOut", delay: 0.3 }}
                  className="absolute top-1/3 right-1/4 transform translate-x-1/2 -translate-y-1/2"
                >
                  <div className="text-8xl">🐰</div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ repeat: Infinity, duration: 3.3, ease: "easeInOut", delay: 0.8 }}
                  className="absolute bottom-1/3 left-1/3 transform -translate-x-1/2 translate-y-1/2"
                >
                  <div className="text-8xl">🐶</div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 1.2 }}
                  className="absolute bottom-1/4 right-1/3 transform translate-x-1/2 translate-y-1/2"
                >
                  <div className="text-8xl">🦊</div>
                </motion.div>
              </div>
              
              {/* Farm elements */}
              <div className="absolute bottom-0 inset-x-0 h-1/4 bg-kawaii-green-400 rounded-t-full"></div>
              <div className="absolute bottom-10 left-1/4 w-10 h-8 bg-gradient-to-t from-kawaii-brown-600 to-kawaii-brown-400 rounded-sm"></div>
              <div className="absolute bottom-10 right-1/4 w-10 h-8 bg-gradient-to-t from-kawaii-brown-600 to-kawaii-brown-400 rounded-sm"></div>
            </div>
            
            {/* Speech bubble */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-md text-kawaii-purple-800 font-medium text-center max-w-xs border border-white/30"
            >
              Join us at the kawaii farm! Create your own animal friends and explore together! ✨
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Feature Sections */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-kawaii-purple-800 mb-12 font-pixel">Explore Dolphinoko Farm Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4 text-center">🏡</div>
              <h3 className="text-xl font-medium text-kawaii-purple-800 mb-2 text-center">Kawaii Farm</h3>
              <p className="text-kawaii-purple-700 text-center">
                A charming farm environment where all your AI assistants live as cute animals.
              </p>
            </motion.div>
            
            <motion.div
              className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4 text-center">🧸</div>
              <h3 className="text-xl font-medium text-kawaii-purple-800 mb-2 text-center">Character Creator</h3>
              <p className="text-kawaii-purple-700 text-center">
                Design your own customized animal assistants with different colors and personalities.
              </p>
            </motion.div>
            
            <motion.div
              className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4 text-center">🔧</div>
              <h3 className="text-xl font-medium text-kawaii-purple-800 mb-2 text-center">Tool Shed</h3>
              <p className="text-kawaii-purple-700 text-center">
                A collection of powerful AI tools for tasks like research, content creation, and more.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 bg-white/70 backdrop-blur-md shadow-inner border-t border-white/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-kawaii-purple-700 text-sm">
            🌱 Dolphinoko Farm Edition | Made with 💖
          </p>
        </div>
      </footer>
    </div>
  )
} 