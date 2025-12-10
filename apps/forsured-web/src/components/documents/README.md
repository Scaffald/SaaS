# Document Upload & Storage (REQ-124)

Complete document upload and management system for insurance certificate compliance.

## Components

### FileUploadZone
Drag-and-drop file upload component with validation and progress tracking.

```tsx
import { FileUploadZone } from './components/documents';

<FileUploadZone
  projectId="project-123"
  uploaderId="user-123"
  subcontractorId="sub-123" // optional
  maxFiles={10} // optional, default 10
  onUpload={(document) => console.log('Uploaded:', document)}
  onError={(error) => console.error('Error:', error)}
/>
```

**Features:**
- Drag-and-drop file upload
- File type validation (PDF only)
- File size validation (1KB - 10MB)
- Real-time upload progress
- Multiple file support
- Client-side validation with user feedback

### DocumentTable
Display and manage uploaded documents with actions.

```tsx
import { DocumentTable } from './components/documents';

<DocumentTable
  documents={documentList}
  onDownload={(doc) => console.log('Download:', doc)}
  onDelete={(id) => console.log('Delete:', id)}
  onReprocess={(id) => console.log('Reprocess:', id)}
  canDelete={(doc) => userCanDelete(doc)}
  canReprocess={(doc) => userCanReprocess(doc)}
/>
```

**Features:**
- Document list display with file info
- Status badges (pending, processing, completed, error)
- Download capability
- Delete with confirmation
- Re-process failed documents
- Empty state handling

### DocumentManagementPage
Complete page integrating upload and document management with RBAC.

```tsx
import { DocumentManagementPage } from './components/documents';

<DocumentManagementPage
  projectId="project-123"
  currentUser={{
    id: 'user-123',
    role: 'manager',
    managed_projects: ['project-123']
  }}
/>
```

**Features:**
- Full RBAC implementation
- Role-based filtering (managers see all, subcontractors see only their own)
- Upload zone with permissions check
- Document table with role-based actions
- Error handling and display
- Loading states

## Services

### DocumentService
Backend service for document upload, storage, and retrieval.

```tsx
import { DocumentService } from './lib/documents';

const service = new DocumentService();

// Upload document
const doc = await service.uploadDocument({
  project_id: 'project-123',
  uploader_id: 'user-123',
  file: pdfFile
});

// Get documents
const docs = await service.getDocuments({
  project_id: 'project-123',
  status: 'pending'
});

// Update status
await service.updateDocumentStatus(doc.id, 'completed');

// Delete document
await service.deleteDocument(doc.id);
```

**Features:**
- File validation (type, size)
- Base64 encoding for MVP storage
- SHA-256 hash for duplicate detection
- CRUD operations
- Status management

## Role-Based Access Control (RBAC)

### Manager Permissions
- Can upload documents for managed projects
- Can view all documents for managed projects
- Can delete any document for managed projects
- Can re-process failed documents

### Subcontractor Permissions
- Can upload documents for assigned projects
- Can view only their own uploaded documents
- Can delete only their own documents
- Can re-process only their own failed documents

### Broker Permissions
- Can upload documents for client projects
- Can view documents for client projects
- Can delete documents they uploaded
- Can re-process failed documents they uploaded

## Storage

**MVP Implementation:**
- Documents stored in MockDatabase
- File data encoded as Base64 strings
- SHA-256 hash for duplicate detection
- In-memory storage (no persistence across page reloads)

**Future Enhancement:**
- Move to cloud storage (S3, GCS)
- Store only file metadata in database
- Add virus scanning
- Implement document versioning

## Testing

All components and services have comprehensive test coverage:

```bash
# Run all document tests
npm test -- src/lib/documents/ src/components/documents/

# Run specific test suites
npm test -- src/lib/documents/documentService.test.ts
npm test -- src/components/documents/FileUploadZone.test.tsx
```

**Test Coverage:**
- 19 DocumentService tests
- 9 FileUploadZone tests
- 100% passing rate
- TDD approach throughout

## File Validation

**Accepted File Type:**
- PDF only (`application/pdf`, `.pdf` extension)

**File Size Limits:**
- Minimum: 1KB
- Maximum: 10MB

**Validation:**
- Client-side validation (immediate feedback)
- Server-side validation (security layer)
- Duplicate detection via SHA-256 hash

## Document Status Lifecycle

1. **pending**: Initial status after upload
2. **processing**: AI extraction in progress
3. **completed**: Successfully processed
4. **error**: Processing failed (can re-process)

## Integration Example

```tsx
import { DocumentManagementPage } from './components/documents';
import { useAuth } from './hooks/useAuth';
import { useParams } from 'react-router-dom';

function ProjectDocumentsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();

  return (
    <DocumentManagementPage
      projectId={projectId}
      currentUser={user}
    />
  );
}
```

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS (for styling)
- MockDatabase (REQ-106)
- FileReader API (Base64 encoding)
- Crypto API (SHA-256 hashing)

## Browser Support

- Modern browsers with FileReader API support
- Drag-and-drop API support
- Crypto.subtle API support (for hashing)
