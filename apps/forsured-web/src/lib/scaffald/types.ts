// src/lib/scaffald/types.ts

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface ScaffaldUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  companies: ScaffaldCompanyMembership[];
  created_at: string;
}

export interface ScaffaldCompanyMembership {
  company_id: string;
  company_name: string;
  role: 'owner' | 'admin' | 'member';
}

export interface ScaffaldCompany {
  id: string;
  name: string;
  address: Address;
  phone?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ScaffaldProject {
  id: string;
  company_id: string;
  name: string;
  address: Address;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyInput {
  name: string;
  address: Address;
  phone?: string;
  website?: string;
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

export interface CreateProjectInput {
  company_id: string;
  name: string;
  address: Address;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface Invitation {
  id: string;
  company_id: string;
  email: string;
}
