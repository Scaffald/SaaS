import { Resource } from './base.js'
import type {
  UploadResumeParams,
  UploadResumeResponse,
  ParseResumeParams,
  ParseResumeResponse,
  HasUploadedResumeResponse,
  ResumeWizardState,
  SaveResumeSectionParams,
  SaveResumeSectionResponse,
  UpdateResumeProgressParams,
  UpdateResumeProgressResponse,
} from '../types/resume.js'

export class Resume extends Resource {
  async hasUploaded(): Promise<HasUploadedResumeResponse> {
    return this.get<HasUploadedResumeResponse>('/v1/resume/has-uploaded')
  }

  async upload(params: UploadResumeParams): Promise<UploadResumeResponse> {
    return this.post<UploadResumeResponse>('/v1/resume/upload', params)
  }

  async parse(params: ParseResumeParams): Promise<ParseResumeResponse> {
    return this.post<ParseResumeResponse>('/v1/resume/parse', params)
  }

  async getWizardState(resumeId: string): Promise<ResumeWizardState | null> {
    return this.get<ResumeWizardState | null>('/v1/resume/wizard-state', { resumeId })
  }

  async saveSection(params: SaveResumeSectionParams): Promise<SaveResumeSectionResponse> {
    return this.post<SaveResumeSectionResponse>('/v1/resume/wizard-state/save-section', params)
  }

  async updateProgress(
    params: UpdateResumeProgressParams
  ): Promise<UpdateResumeProgressResponse> {
    return this.post<UpdateResumeProgressResponse>(
      '/v1/resume/wizard-state/update-progress',
      params
    )
  }
}
