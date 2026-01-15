/**
 * FileUpload component Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View } from 'react-native'
import { FileUpload } from '../../../components/FileUpload'
import type { UploadedFile } from '../../../components/FileUpload'
import { ThemeProvider } from '../../../theme'

const meta: Meta<typeof FileUpload> = {
  title: 'Components/FileUpload',
  component: FileUpload,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <View style={{ padding: 24, maxWidth: 600 }}>
          <Story />
        </View>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'FileUpload component for uploading files with drag-and-drop support, progress tracking, and validation.',
      },
    },
  },
  argTypes: {
    multiple: {
      control: 'boolean',
      description: 'Allow multiple file selection',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the component',
    },
    variant: {
      control: 'select',
      options: ['default', 'featured-icon'],
      description: 'Visual variant',
    },
    accept: {
      control: 'text',
      description: 'Accepted file types (e.g., "image/*,application/pdf")',
    },
    maxSize: {
      control: 'number',
      description: 'Maximum file size in bytes',
    },
    maxFiles: {
      control: 'number',
      description: 'Maximum number of files allowed',
    },
  },
}

export default meta
type Story = StoryObj<typeof FileUpload>

/**
 * Default empty upload state
 */
export const Default: Story = {
  args: {
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * With custom label and helper text
 */
export const WithLabel: Story = {
  args: {
    label: 'Upload Documents',
    helperText: 'Max file size 5MB',
    emptyMessage: 'Drag & drop documents or click to browse',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * Image files only
 */
export const ImagesOnly: Story = {
  args: {
    label: 'Upload Images',
    accept: 'image/*',
    helperText: 'Only image files accepted',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * PDF files only with size limit
 */
export const PDFsOnly: Story = {
  args: {
    label: 'Upload PDF Documents',
    accept: 'application/pdf',
    maxSize: 5 * 1024 * 1024, // 5MB
    helperText: 'PDF files only, max 5MB',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * Single file only
 */
export const SingleFile: Story = {
  args: {
    label: 'Upload Profile Picture',
    multiple: false,
    accept: 'image/*',
    maxSize: 2 * 1024 * 1024, // 2MB
    helperText: 'Single image, max 2MB',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * Maximum 3 files
 */
export const MaxFiles: Story = {
  args: {
    label: 'Upload up to 3 files',
    maxFiles: 3,
    helperText: 'Maximum 3 files allowed',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    label: 'Upload Files',
    disabled: true,
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * With error message
 */
export const WithError: Story = {
  args: {
    label: 'Upload Files',
    error: 'File size exceeds maximum of 5MB',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * Controlled mode with files uploading
 */
export const WithUploadingFiles: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadedFile[]>([
      {
        id: 'file-1',
        name: 'presentation.pdf',
        size: 2.5 * 1024 * 1024,
        type: 'application/pdf',
        file: new File([], 'presentation.pdf'),
        status: 'uploading',
        progress: 45,
        uploadedSize: 1.125 * 1024 * 1024,
      },
      {
        id: 'file-2',
        name: 'image.jpg',
        size: 1.2 * 1024 * 1024,
        type: 'image/jpeg',
        file: new File([], 'image.jpg'),
        status: 'uploading',
        progress: 70,
        uploadedSize: 0.84 * 1024 * 1024,
      },
    ])

    return (
      <FileUpload
        label="Uploading Files"
        files={files}
        onFilesSelected={(newFiles) => {
          console.log('New files selected:', newFiles)
        }}
        onFileRemove={(fileId) => {
          setFiles(files.filter((f) => f.id !== fileId))
        }}
      />
    )
  },
}

/**
 * With completed and pending files
 */
export const WithMixedStatus: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadedFile[]>([
      {
        id: 'file-1',
        name: 'document.pdf',
        size: 1.5 * 1024 * 1024,
        type: 'application/pdf',
        file: new File([], 'document.pdf'),
        status: 'success',
      },
      {
        id: 'file-2',
        name: 'failed-upload.jpg',
        size: 2.8 * 1024 * 1024,
        type: 'image/jpeg',
        file: new File([], 'failed-upload.jpg'),
        status: 'error',
        error: 'Network error during upload',
      },
      {
        id: 'file-3',
        name: 'video.mp4',
        size: 5.2 * 1024 * 1024,
        type: 'video/mp4',
        file: new File([], 'video.mp4'),
        status: 'uploading',
        progress: 23,
        uploadedSize: 1.2 * 1024 * 1024,
      },
    ])

    return (
      <FileUpload
        label="Upload Status"
        files={files}
        onFilesSelected={(newFiles) => {
          console.log('New files selected:', newFiles)
        }}
        onFileRemove={(fileId) => {
          setFiles(files.filter((f) => f.id !== fileId))
        }}
      />
    )
  },
}

/**
 * Featured icon variant
 */
export const FeaturedIcon: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadedFile[]>([
      {
        id: 'file-1',
        name: 'presentation.pptx',
        size: 3.2 * 1024 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        file: new File([], 'presentation.pptx'),
        status: 'uploading',
        progress: 55,
        uploadedSize: 1.76 * 1024 * 1024,
      },
    ])

    return (
      <FileUpload
        label="Featured Icon Upload"
        variant="featured-icon"
        files={files}
        onFilesSelected={(newFiles) => {
          console.log('New files selected:', newFiles)
        }}
        onFileRemove={(fileId) => {
          setFiles(files.filter((f) => f.id !== fileId))
        }}
      />
    )
  },
}

/**
 * Controlled mode with state management
 */
export const Controlled: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadedFile[]>([])

    const handleFilesSelected = (newFiles: File[]) => {
      // Convert File objects to UploadedFile format
      const uploadedFiles: UploadedFile[] = newFiles.map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        status: 'pending' as const,
      }))

      setFiles([...files, ...uploadedFiles])

      // Simulate upload progress
      uploadedFiles.forEach((uploadedFile, index) => {
        setTimeout(() => {
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'uploading' as const, progress: 0 }
                : f
            )
          )

          // Simulate progress updates
          let progress = 0
          const interval = setInterval(() => {
            progress += 10
            if (progress >= 100) {
              clearInterval(interval)
              setFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.id === uploadedFile.id ? { ...f, status: 'success' as const } : f
                )
              )
            } else {
              setFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.id === uploadedFile.id
                    ? {
                        ...f,
                        progress,
                        uploadedSize: (uploadedFile.size * progress) / 100,
                      }
                    : f
                )
              )
            }
          }, 300)
        }, index * 500)
      })
    }

    const handleFileRemove = (fileId: string) => {
      setFiles(files.filter((f) => f.id !== fileId))
    }

    return (
      <FileUpload
        label="Controlled Upload with Progress Simulation"
        files={files}
        onFilesSelected={handleFilesSelected}
        onFileRemove={handleFileRemove}
        helperText="Files will simulate upload progress"
      />
    )
  },
}

/**
 * Dark theme
 */
export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <View style={{ padding: 24, maxWidth: 600, backgroundColor: '#0a0e14' }}>
          <Story />
        </View>
      </ThemeProvider>
    ),
  ],
  args: {
    label: 'Upload Files',
    helperText: 'Max file size 5MB',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    label: 'Upload Files',
    helperText: 'Max file size 5MB',
    multiple: true,
    disabled: false,
    variant: 'default',
    onFilesSelected: (files) => {
      console.log('Files selected:', files)
    },
  },
}
