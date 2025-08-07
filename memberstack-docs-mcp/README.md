# Memberstack Documentation MCP Server

An MCP (Model Context Protocol) server that provides intelligent access to Memberstack DOM documentation for AI coding assistants like Claude Code.

## Features

- **Smart Search**: Fuzzy search across all documentation with relevance scoring
- **Method Information**: Detailed method signatures, parameters, and examples
- **Code Examples**: Extract relevant code examples for specific use cases
- **Categorized Access**: Browse methods by category (auth, members, plans, etc.)
- **Resource Access**: Direct access to documentation sections via MCP resources

## Installation

```bash
cd memberstack-docs-mcp
npm install
npm run build
```

## Usage

### Standalone Server
```bash
# With environment variable
export MEMBERSTACK_DOCS_PATH=/path/to/memberstack-docs-md
npm start

# With command line argument
npm start /path/to/memberstack-docs-md
```

### Integration with Claude Code

Add to your MCP settings (usually `~/Library/Application Support/Claude/mcp_servers.json`):

```json
{
  "memberstack-docs": {
    "command": "/Users/juliangalluzzo/Desktop/memberstack/memberstack-ai-context/memberstack-docs-mcp/dist/index.js",
    "args": ["/Users/juliangalluzzo/Desktop/memberstack/memberstack-ai-context/memberstack-docs-md"],
    "env": {
      "MEMBERSTACK_DOCS_PATH": "/Users/juliangalluzzo/Desktop/memberstack/memberstack-ai-context/memberstack-docs-md"
    }
  }
}
```

## Available Tools

### `search_memberstack_docs`
Search through documentation for topics, methods, or concepts.
- `query`: Search terms (method names, topics, keywords)
- `limit`: Maximum results (default: 5)

### `get_method_info`
Get detailed information about a specific method.
- `method_name`: Name of the method (e.g., "loginMemberEmailPassword")

### `list_methods_by_category` 
List all methods organized by category.
- `category`: Filter by category or "all" (auth, members, plans, ui, advanced)

### `get_section_summary`
Get a summary of a documentation section.
- `section_id`: Section ID (e.g., "02-authentication")

### `get_code_examples`
Get code examples for a specific method or use case.
- `topic`: Method name or use case (e.g., "login", "social-auth")

## Available Resources

Access documentation sections directly:
- `memberstack://docs/00-overview` - Package overview
- `memberstack://docs/01-initialization` - Setup and configuration  
- `memberstack://docs/02-authentication` - Authentication methods
- `memberstack://docs/03-member-management` - Member operations
- `memberstack://docs/04-plan-management` - Subscription management
- `memberstack://docs/05-ui-components` - Pre-built UI components
- And more...

## Example Usage with Claude Code

```bash
# Search for authentication methods
search_memberstack_docs query="login password"

# Get specific method information
get_method_info method_name="loginMemberEmailPassword"

# List all authentication methods
list_methods_by_category category="auth"

# Get code examples for social login
get_code_examples topic="social login"
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Start server
npm start
```

## Configuration

### Environment Variables
- `MEMBERSTACK_DOCS_PATH`: Path to memberstack-docs-md directory

### Command Line Arguments
Pass the documentation path as the first argument:
```bash
node dist/index.js /path/to/memberstack-docs-md
```

## Architecture

- **DocParser**: Parses markdown files and builds searchable index
- **MemberstackDocsServer**: MCP server implementation with resource and tool handlers
- **Search**: Uses Fuse.js for fuzzy search with relevance scoring
- **Indexing**: Extracts methods, parameters, examples, and metadata from documentation

## Troubleshooting

### Server Won't Start
- Ensure the documentation path exists
- Check that all markdown files are accessible
- Verify Node.js version is compatible (>=16)

### Search Not Working
- Rebuild the search index by restarting the server
- Check that markdown files contain the expected format

### MCP Integration Issues
- Verify the MCP server configuration in Claude Code
- Check that the server binary path is correct
- Review server logs for error messages