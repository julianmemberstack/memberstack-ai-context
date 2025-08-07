export interface DocSection {
  id: string;
  title: string;
  filename: string;
  content: string;
  category: 'setup' | 'auth' | 'members' | 'plans' | 'ui' | 'advanced' | 'reference';
  methods?: string[];
  tags?: string[];
}

export interface SearchResult {
  section: DocSection;
  score: number;
  matches: string[];
}

export interface MethodInfo {
  name: string;
  signature: string;
  parameters: Parameter[];
  returnType: string;
  examples: string[];
  section: string;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface DocIndex {
  sections: DocSection[];
  methods: MethodInfo[];
  searchIndex: any; // Fuse.js index
}