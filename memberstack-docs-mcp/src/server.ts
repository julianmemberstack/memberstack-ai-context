import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DocParser } from './doc-parser.js';
import { join } from 'path';

export class MemberstackDocsServer {
  private server: Server;
  private parser: DocParser;

  constructor(docsPath: string) {
    this.server = new Server({
      name: 'memberstack-docs',
      version: '1.0.0',
    });

    this.parser = new DocParser(docsPath);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.setupResourceHandlers();
    this.setupToolHandlers();
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const sections = await this.parser.getAllSections();
      
      return {
        resources: sections.map(section => ({
          uri: `memberstack://docs/${section.id}`,
          name: section.title,
          description: `${section.category} - ${section.methods?.join(', ') || 'Documentation section'}`,
          mimeType: 'text/markdown',
        })),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const url = new URL(request.params.uri);
      
      if (url.protocol !== 'memberstack:') {
        throw new McpError(ErrorCode.InvalidRequest, 'Invalid protocol');
      }

      const path = url.pathname;
      
      if (path.startsWith('/docs/')) {
        const sectionId = path.replace('/docs/', '');
        const section = await this.parser.getSection(sectionId);
        
        if (!section) {
          throw new McpError(ErrorCode.InvalidRequest, `Section ${sectionId} not found`);
        }

        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'text/markdown',
              text: section.content,
            },
          ],
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, 'Unknown resource path');
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_memberstack_docs',
            description: 'Search through Memberstack documentation for specific topics, methods, or concepts',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (method names, topics, keywords)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 5)',
                  default: 5,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_method_info',
            description: 'Get detailed information about a specific Memberstack DOM method',
            inputSchema: {
              type: 'object',
              properties: {
                method_name: {
                  type: 'string',
                  description: 'Name of the method (e.g., loginMemberEmailPassword, getCurrentMember)',
                },
              },
              required: ['method_name'],
            },
          },
          {
            name: 'list_methods_by_category',
            description: 'List all available methods organized by category',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: ['auth', 'members', 'plans', 'ui', 'advanced', 'all'],
                  description: 'Category to filter by, or "all" for everything',
                  default: 'all',
                },
              },
            },
          },
          {
            name: 'get_section_summary',
            description: 'Get a summary of a documentation section with key points',
            inputSchema: {
              type: 'object',
              properties: {
                section_id: {
                  type: 'string',
                  description: 'Section ID (e.g., 02-authentication, 03-member-management)',
                },
              },
              required: ['section_id'],
            },
          },
          {
            name: 'get_code_examples',
            description: 'Get code examples for a specific method or use case',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'Method name or use case (e.g., login, social-auth, plan-purchase)',
                },
              },
              required: ['topic'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'search_memberstack_docs':
          return await this.handleSearchDocs(request.params.arguments);

        case 'get_method_info':
          return await this.handleGetMethodInfo(request.params.arguments);

        case 'list_methods_by_category':
          return await this.handleListMethodsByCategory(request.params.arguments);

        case 'get_section_summary':
          return await this.handleGetSectionSummary(request.params.arguments);

        case 'get_code_examples':
          return await this.handleGetCodeExamples(request.params.arguments);

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async handleSearchDocs(args: any) {
    const { query, limit = 5 } = args;
    const results = await this.parser.search(query, limit);

    const formattedResults = results.map((result: any) => {
      const item = result.item;
      return {
        title: item.title || item.name,
        type: item.content ? 'section' : 'method',
        relevance: (1 - (result.score || 0)) * 100,
        preview: this.getPreview(item, query),
        section: item.section || item.id,
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} results for "${query}":\n\n` +
            formattedResults.map((r: any) => 
              `**${r.title}** (${r.type}, ${r.relevance.toFixed(0)}% relevant)\n` +
              `Section: ${r.section}\n` +
              `Preview: ${r.preview}\n`
            ).join('\n'),
        },
      ],
    };
  }

  private async handleGetMethodInfo(args: any) {
    const { method_name } = args;
    const method = await this.parser.getMethod(method_name);

    if (!method) {
      return {
        content: [
          {
            type: 'text',
            text: `Method "${method_name}" not found in documentation.`,
          },
        ],
      };
    }

    const paramsList = method.parameters.map(p => 
      `- ${p.name}${p.required ? '' : '?'}: ${p.type} ${p.description ? `- ${p.description}` : ''}`
    ).join('\n');

    const examplesList = method.examples.length > 0 
      ? '\n\n**Examples:**\n```javascript\n' + method.examples.join('\n\n') + '\n```'
      : '';

    return {
      content: [
        {
          type: 'text',
          text: `# ${method.name}()\n\n` +
            `**Signature:**\n\`\`\`typescript\n${method.signature}\n\`\`\`\n\n` +
            `**Parameters:**\n${paramsList}\n\n` +
            `**Return Type:** ${method.returnType}\n\n` +
            `**Documentation Section:** ${method.section}${examplesList}`,
        },
      ],
    };
  }

  private async handleListMethodsByCategory(args: any) {
    const { category = 'all' } = args;
    const sections = await this.parser.getAllSections();
    
    let filteredSections = sections;
    if (category !== 'all') {
      filteredSections = sections.filter(s => s.category === category);
    }

    const methodsBySection = filteredSections.map(section => ({
      section: section.title,
      category: section.category,
      methods: section.methods || [],
    })).filter(s => s.methods.length > 0);

    const output = methodsBySection.map(s => 
      `## ${s.section} (${s.category})\n${s.methods.map(m => `- ${m}()`).join('\n')}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Memberstack DOM Methods${category !== 'all' ? ` - ${category}` : ''}\n\n${output}`,
        },
      ],
    };
  }

  private async handleGetSectionSummary(args: any) {
    const { section_id } = args;
    const section = await this.parser.getSection(section_id);

    if (!section) {
      return {
        content: [
          {
            type: 'text',
            text: `Section "${section_id}" not found.`,
          },
        ],
      };
    }

    // Extract key points (headings and first paragraph of each section)
    const summary = this.extractSummary(section.content);
    
    return {
      content: [
        {
          type: 'text',
          text: `# ${section.title}\n\n` +
            `**Category:** ${section.category}\n` +
            `**Methods:** ${section.methods?.join(', ') || 'None'}\n\n` +
            `**Summary:**\n${summary}`,
        },
      ],
    };
  }

  private async handleGetCodeExamples(args: any) {
    const { topic } = args;
    const results = await this.parser.search(topic, 3);
    
    const examples: string[] = [];
    
    for (const result of results) {
      const item = result.item;
      if (item.content) {
        // Extract code blocks from content
        const codeBlocks = this.extractCodeBlocks(item.content, topic);
        examples.push(...codeBlocks);
      }
      if (item.examples) {
        examples.push(...item.examples);
      }
    }

    const uniqueExamples = [...new Set(examples)];

    return {
      content: [
        {
          type: 'text',
          text: `# Code Examples for "${topic}"\n\n` +
            uniqueExamples.map(example => 
              `\`\`\`javascript\n${example}\n\`\`\``
            ).join('\n\n'),
        },
      ],
    };
  }

  private getPreview(item: any, query: string): string {
    const content = item.content || item.signature || '';
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    
    if (queryIndex === -1) {
      return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    }
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, queryIndex + 100);
    const preview = content.substring(start, end);
    
    return (start > 0 ? '...' : '') + preview + (end < content.length ? '...' : '');
  }

  private extractSummary(content: string): string {
    const lines = content.split('\n');
    const summaryLines: string[] = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) continue;
      
      // Include headings and first paragraph after each heading
      if (line.startsWith('#') || (line.trim() && !line.startsWith('|') && summaryLines.length < 10)) {
        summaryLines.push(line);
      }
    }
    
    return summaryLines.join('\n');
  }

  private extractCodeBlocks(content: string, topic: string): string[] {
    const codeBlockRegex = /```(?:javascript|typescript)\n([\s\S]*?)\n```/g;
    const blocks: string[] = [];
    
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1];
      if (code.toLowerCase().includes(topic.toLowerCase())) {
        blocks.push(code);
      }
    }
    
    return blocks;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Memberstack docs MCP server running on stdio');
  }
}