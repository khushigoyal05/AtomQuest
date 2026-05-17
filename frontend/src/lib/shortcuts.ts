import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac')
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (cmdOrCtrl && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('global-search')
        if (searchInput) {
          searchInput.focus()
          ;(searchInput as HTMLInputElement).select()
        }
      }

      if (cmdOrCtrl && e.key === 'p') {
        e.preventDefault()
        window.print()
      }

      if (cmdOrCtrl && e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        navigate(-1)
      }

      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[data-modal]')
        modals.forEach((m) => {
          const closeBtn = m.querySelector('[data-modal-close]') as HTMLButtonElement
          closeBtn?.click()
        })
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}
