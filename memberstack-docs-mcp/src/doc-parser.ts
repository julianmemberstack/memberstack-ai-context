import { readFileSync } from 'fs';
import { join } from 'path';
import glob from 'fast-glob';
import Fuse from 'fuse.js';
import { DocSection, MethodInfo, DocIndex, Parameter } from './types.js';

export class DocParser {
  private docsPath: string;
  private index: DocIndex | null = null;

  constructor(docsPath: string) {
    this.docsPath = docsPath;
  }

  async buildIndex(): Promise<DocIndex> {
    if (this.index) return this.index;

    const sections = await this.parseSections();
    const methods = this.extractMethods(sections);
    
    const searchIndex = new Fuse([...sections, ...methods], {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'content', weight: 0.2 },
        { name: 'methods', weight: 0.2 },
        { name: 'tags', weight: 0.1 },
        { name: 'name', weight: 0.4 }, // for methods
        { name: 'signature', weight: 0.3 },
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
    });

    this.index = { sections, methods, searchIndex };
    return this.index;
  }

  private async parseSections(): Promise<DocSection[]> {
    const files = await glob('*.md', { cwd: this.docsPath });
    const sections: DocSection[] = [];

    for (const file of files) {
      const content = readFileSync(join(this.docsPath, file), 'utf-8');
      const section = this.parseMarkdownFile(file, content);
      sections.push(section);
    }

    return sections.sort((a, b) => a.id.localeCompare(b.id));
  }

  private parseMarkdownFile(filename: string, content: string): DocSection {
    // Extract title from first heading
    const titleMatch = content.match(/^# (.+)/m);
    const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');

    // Extract category from filename prefix
    const category = this.getCategoryFromFilename(filename);

    // Extract method names from code blocks
    const methods = this.extractMethodNames(content);

    // Extract tags from content
    const tags = this.extractTags(content);

    return {
      id: filename.replace('.md', ''),
      title,
      filename,
      content,
      category,
      methods,
      tags,
    };
  }

  private getCategoryFromFilename(filename: string): DocSection['category'] {
    const prefix = filename.split('-')[0];
    const categoryMap: Record<string, DocSection['category']> = {
      '00': 'setup',
      '01': 'setup',
      '02': 'auth',
      '03': 'members',
      '04': 'plans',
      '05': 'ui',
      '06': 'members',
      '07': 'advanced',
      '08': 'reference',
      '09': 'reference',
      '10': 'reference',
    };
    return categoryMap[prefix] || 'reference';
  }

  private extractMethodNames(content: string): string[] {
    const methods: string[] = [];
    
    // Extract from method signatures like: await memberstack.methodName(
    const methodMatches = content.matchAll(/await memberstack\.(\w+)\(/g);
    for (const match of methodMatches) {
      if (!methods.includes(match[1])) {
        methods.push(match[1]);
      }
    }

    // Extract from heading patterns like: ### methodName()
    const headingMatches = content.matchAll(/###?\s+(\w+)\(\)/g);
    for (const match of headingMatches) {
      if (!methods.includes(match[1])) {
        methods.push(match[1]);
      }
    }

    return methods;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract common terms
    const tagPatterns = [
      /authentication/gi,
      /login/gi,
      /signup/gi,
      /password/gi,
      /modal/gi,
      /member/gi,
      /plan/gi,
      /subscription/gi,
      /social/gi,
      /oauth/gi,
    ];

    for (const pattern of tagPatterns) {
      if (pattern.test(content)) {
        tags.push(pattern.source.replace('/gi', '').replace('/', ''));
      }
    }

    return [...new Set(tags)];
  }

  private extractMethods(sections: DocSection[]): MethodInfo[] {
    const methods: MethodInfo[] = [];

    for (const section of sections) {
      const methodsInSection = this.parseMethodsFromSection(section);
      methods.push(...methodsInSection);
    }

    return methods;
  }

  private parseMethodsFromSection(section: DocSection): MethodInfo[] {
    const methods: MethodInfo[] = [];
    const content = section.content;

    // Look for method signature patterns
    const signatureRegex = /```typescript\n(async )?(\w+)\.(\w+)\(([\s\S]*?)\):\s*Promise<(.*?)>\n```/g;
    
    let match;
    while ((match = signatureRegex.exec(content)) !== null) {
      const [, isAsync, object, methodName, paramsStr, returnType] = match;
      
      if (object === 'memberstack') {
        const parameters = this.parseParameters(paramsStr);
        const examples = this.extractExamplesForMethod(content, methodName);
        
        methods.push({
          name: methodName,
          signature: match[0],
          parameters,
          returnType,
          examples,
          section: section.id,
        });
      }
    }

    return methods;
  }

  private parseParameters(paramsStr: string): Parameter[] {
    const parameters: Parameter[] = [];
    
    // Simple parameter parsing - could be enhanced
    const lines = paramsStr.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (const line of lines) {
      const match = line.match(/(\w+)(\?)?:\s*(.+);?/);
      if (match) {
        const [, name, optional, type] = match;
        parameters.push({
          name,
          type: type.replace(';', ''),
          required: !optional,
          description: '', // Could extract from documentation
        });
      }
    }

    return parameters;
  }

  private extractExamplesForMethod(content: string, methodName: string): string[] {
    const examples: string[] = [];
    
    // Find code blocks that contain the method name
    const codeBlockRegex = /```javascript\n([\s\S]*?)\n```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1];
      if (code.includes(methodName)) {
        examples.push(code);
      }
    }

    return examples;
  }

  async search(query: string, limit = 10) {
    const index = await this.buildIndex();
    const results = index.searchIndex.search(query, { limit });
    
    return results.map((result: any) => ({
      item: result.item,
      score: result.score,
      matches: result.matches?.map((m: any) => m.value) || [],
    }));
  }

  async getSection(id: string): Promise<DocSection | null> {
    const index = await this.buildIndex();
    return index.sections.find(section => section.id === id) || null;
  }

  async getMethod(name: string): Promise<MethodInfo | null> {
    const index = await this.buildIndex();
    return index.methods.find(method => method.name === name) || null;
  }

  async getAllSections(): Promise<DocSection[]> {
    const index = await this.buildIndex();
    return index.sections;
  }

  async getAllMethods(): Promise<MethodInfo[]> {
    const index = await this.buildIndex();
    return index.methods;
  }
}