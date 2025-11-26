import { vi } from 'vitest';

const mockApi = {
  applications: {
    submit: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: false,
        isError: false,
      })),
    },
    updateStep: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: false,
        isError: false,
      })),
    },
  },
  jobs: {
    createApplication: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: false,
        isError: false,
      })),
    },
    updateApplication: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: false,
        isError: false,
      })),
    },
  },
  profile: {
    education: {
      getEducation: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          isSuccess: true,
          isError: false,
        })),
      },
    },
    completion: {
      getPersonalizedBenefits: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          isSuccess: true,
          isError: false,
        })),
      },
    },
    skills: {
        searchParentSkills: {
            useMutation: vi.fn(() => ({
                mutate: vi.fn(),
                isLoading: false,
                isSuccess: false,
                isError: false,
            })),
        },
    },
    skillsMultiTaxonomy: {
        getPrimaryIndustry: {
            useQuery: vi.fn(() => ({
                data: [],
                isLoading: false,
                isSuccess: true,
                isError: false,
            })),
        },
    },
  },
  office: {
    universities: {
      searchUniversities: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          isSuccess: true,
          isError: false,
        })),
      },
    },
  },
};

vi.mock('@app/core/utils/api', () => ({
  api: mockApi,
}));
