'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { Upload, FileText } from 'lucide-react'

interface Props {
  onFileLoaded: (headers: string[], data: Record<string, string>[], fileName: string) => void
}

export function CSVUploadStep({ onFileLoaded }: Props) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || []
        const data = result.data as Record<string, string>[]
        onFileLoaded(headers, data, file.name)
      },
      error: (err) => {
        alert('Failed to parse CSV: ' + err.message)
      },
    })
  }, [onFileLoaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
      {isDragActive ? (
        <p className="text-sm font-medium">Drop the CSV file here...</p>
      ) : (
        <>
          <p className="text-sm font-medium">Drag & drop a CSV file, or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">.csv files only, max 10MB</p>
        </>
      )}
    </div>
  )
}
