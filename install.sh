#!/bin/bash

# Memberstack AI Context Installation Script
# This script installs the Memberstack AI Context MCP server for AI coding assistants

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}🔧 $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org"
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        error "Node.js version $NODE_VERSION detected. Please upgrade to Node.js 16 or higher"
    fi
    
    success "Node.js $NODE_VERSION detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm"
    fi
    success "npm detected"
}

# Install via npm
install_npm() {
    log "Installing @memberstack/ai-context globally..."
    
    if npm install -g @memberstack/ai-context; then
        success "Package installed successfully!"
        
        echo ""
        echo "🚀 Installation complete! Run setup:"
        echo ""
        echo "  memberstack-ai-context setup"
        echo ""
        echo "Or setup for specific editors:"
        echo "  memberstack-ai-context setup:claude    # Claude Code"
        echo "  memberstack-ai-context setup:cursor    # Cursor"
        echo ""
        
        return 0
    else
        warning "NPM installation failed, trying alternative method..."
        return 1
    fi
}

# Install from GitHub (fallback)
install_github() {
    log "Installing from GitHub repository..."
    
    # Create installation directory
    INSTALL_DIR="$HOME/.memberstack-ai-context"
    
    if [ -d "$INSTALL_DIR" ]; then
        log "Removing existing installation..."
        rm -rf "$INSTALL_DIR"
    fi
    
    log "Cloning repository..."
    git clone https://github.com/julianmemberstack/memberstack-ai-context.git "$INSTALL_DIR"
    
    cd "$INSTALL_DIR"
    
    log "Installing dependencies..."
    npm install
    
    log "Building MCP server..."
    npm run build
    
    # Create global symlink
    log "Creating global command..."
    
    # Create bin directory if it doesn't exist
    mkdir -p "$HOME/.local/bin"
    
    # Create wrapper script
    cat > "$HOME/.local/bin/memberstack-ai-context" << EOF
#!/bin/bash
node "$INSTALL_DIR/scripts/cli.js" "\$@"
EOF
    
    chmod +x "$HOME/.local/bin/memberstack-ai-context"
    
    success "Installation complete!"
    
    # Check if ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        warning "Please add ~/.local/bin to your PATH:"
        echo ""
        echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
        echo "  source ~/.bashrc"
        echo ""
        echo "Or for zsh:"
        echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.zshrc"
        echo "  source ~/.zshrc"
        echo ""
    fi
    
    echo "🚀 Installation complete! Run setup:"
    echo ""
    echo "  memberstack-ai-context setup"
    echo ""
}

# Main installation function
main() {
    echo ""
    echo "🚀 Memberstack AI Context Installer"
    echo ""
    echo "This will install the Memberstack AI Context MCP server"
    echo "for AI coding assistants like Claude Code and Cursor."
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    
    # Try npm installation first
    if ! install_npm; then
        log "Falling back to GitHub installation..."
        
        # Check for git
        if ! command -v git &> /dev/null; then
            error "git is required for fallback installation. Please install git or fix npm"
        fi
        
        install_github
    fi
    
    echo ""
    success "Installation successful!"
    echo ""
    echo "📖 Documentation: https://github.com/julianmemberstack/memberstack-ai-context"
    echo "🐛 Issues: https://github.com/julianmemberstack/memberstack-ai-context/issues"
    echo ""
}

# Run main function
main