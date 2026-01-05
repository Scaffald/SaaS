/**
 * React Example - Using Scaffald SDK with React Query
 */

import { useState } from 'react'
import {
  ScaffaldProvider,
  useJobs,
  useJob,
  useSimilarJobs,
  useCreateQuickApplication,
} from '@scaffald/sdk/react'
import type { Job } from '@scaffald/sdk'

/**
 * Root App Component
 */
export function App() {
  return (
    <ScaffaldProvider
      config={{
        accessToken: import.meta.env.VITE_SCAFFALD_ACCESS_TOKEN,
      }}
    >
      <div className="app">
        <header>
          <h1>🚀 Scaffald Job Board</h1>
        </header>
        <main>
          <JobsExplorer />
        </main>
      </div>
    </ScaffaldProvider>
  )
}

/**
 * Jobs Explorer Component
 */
function JobsExplorer() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    remoteOption: 'remote' as const,
    limit: 20,
  })

  const {
    data: jobs,
    isLoading,
    error,
  } = useJobs({
    status: 'published',
    ...filters,
  })

  if (isLoading) {
    return <div className="loading">Loading jobs...</div>
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>
  }

  return (
    <div className="jobs-explorer">
      <div className="filters">
        <label>
          Remote Option:
          <select
            value={filters.remoteOption}
            onChange={(e) =>
              setFilters({
                ...filters,
                remoteOption: e.target.value as 'remote' | 'hybrid' | 'on_site',
              })
            }
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on_site">On-site</option>
          </select>
        </label>
      </div>

      <div className="jobs-grid">
        <div className="jobs-list">
          <h2>Available Jobs ({jobs?.pagination.total})</h2>
          {jobs?.data.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJobId === job.id}
              onClick={() => setSelectedJobId(job.id)}
            />
          ))}
        </div>

        {selectedJobId && (
          <div className="job-detail">
            <JobDetail jobId={selectedJobId} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Job Card Component
 */
interface JobCardProps {
  job: Job
  isSelected: boolean
  onClick: () => void
}

function JobCard({ job, isSelected, onClick }: JobCardProps) {
  return (
    <button
      type="button"
      className={`job-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick()
        }
      }}
    >
      <h3>{job.title}</h3>
      <div className="job-meta">
        <span>📍 {job.location || 'Remote'}</span>
        <span>💼 {job.employment_type || 'N/A'}</span>
      </div>
    </button>
  )
}

/**
 * Job Detail Component
 */
function JobDetail({ jobId }: { jobId: string }) {
  const { data: job, isLoading } = useJob(jobId)
  const { data: similar } = useSimilarJobs(jobId, { limit: 3 })
  const createApplication = useCreateQuickApplication()

  if (isLoading) {
    return <div className="loading">Loading job details...</div>
  }

  if (!job) {
    return null
  }

  const handleQuickApply = () => {
    createApplication.mutate(
      {
        jobId: job.data.id,
        currentLocation: 'San Francisco, CA',
        availableStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
      {
        onSuccess: () => {
          alert('Application submitted successfully!')
        },
        onError: (error) => {
          alert(`Failed to submit application: ${error.message}`)
        },
      }
    )
  }

  return (
    <div>
      <h2>{job.data.title}</h2>
      <div className="job-info">
        <p>
          <strong>Location:</strong> {job.data.location || 'Remote'}
        </p>
        <p>
          <strong>Type:</strong> {job.data.employment_type}
        </p>
        <p>
          <strong>Remote:</strong> {job.data.remote_option}
        </p>
        {job.data.number_of_openings && (
          <p>
            <strong>Openings:</strong> {job.data.number_of_openings}
          </p>
        )}
      </div>

      <div className="description">
        <h3>Description</h3>
        <p>{job.data.description}</p>
      </div>

      <button
        type="button"
        onClick={handleQuickApply}
        disabled={createApplication.isPending}
        className="apply-button"
      >
        {createApplication.isPending ? 'Applying...' : 'Quick Apply'}
      </button>

      {similar && similar.data.length > 0 && (
        <div className="similar-jobs">
          <h3>Similar Jobs</h3>
          {similar.data.map((similarJob) => (
            <div key={similarJob.id} className="similar-job">
              <strong>{similarJob.title}</strong>
              <span> - {similarJob.location || 'Remote'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
