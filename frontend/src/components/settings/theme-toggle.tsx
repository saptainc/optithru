'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sun, Palette, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [shankaraActive, setShankaraActive] = useState(false)

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    setShankaraActive(current === 'shankara')
  }, [])

  function applyTheme(mode: 'light' | 'dark' | 'shankara') {
    if (mode === 'shankara') {
      setTheme('light')
      document.documentElement.setAttribute('data-theme', 'shankara')
      setShankaraActive(true)
    } else {
      document.documentElement.removeAttribute('data-theme')
      setTheme(mode)
      setShankaraActive(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Choose your visual theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button
            variant={!shankaraActive && theme === 'light' ? 'default' : 'outline'}
            onClick={() => applyTheme('light')}
            className="flex-1"
          >
            <Sun className="h-4 w-4 mr-2" /> Default
          </Button>
          <Button
            variant={shankaraActive ? 'default' : 'outline'}
            onClick={() => applyTheme('shankara')}
            className="flex-1"
          >
            <Palette className="h-4 w-4 mr-2" /> Shankara
          </Button>
          <Button
            variant={!shankaraActive && theme === 'dark' ? 'default' : 'outline'}
            onClick={() => applyTheme('dark')}
            className="flex-1"
          >
            <Moon className="h-4 w-4 mr-2" /> Dark
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
