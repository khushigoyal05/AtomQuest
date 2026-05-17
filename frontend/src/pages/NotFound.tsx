import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Atom } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-8 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Atom size={32} className="text-white" />
        </div>
        <h1 className="text-7xl font-black text-gray-200 dark:text-zinc-800 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-500 mb-8">The page you're looking for doesn't exist or you don't have access.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft size={16} /> Go Back</button>
          <button onClick={() => navigate('/')} className="btn-primary"><Home size={16} /> Dashboard</button>
        </div>
      </motion.div>
    </div>
  )
}
