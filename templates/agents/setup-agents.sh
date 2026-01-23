#!/bin/bash
# setup-agents.sh - Install custom agents (part of knowledge-system setup)

set -e

echo "🤖 Installing Custom Agents (Developer + Architect Workflow)"
echo ""

# Detect or use provided ESSENTIALS file name
ESSENTIALS_FILE="${1:-CODEBASE_ESSENTIALS.md}"

# Create agents directory
mkdir -p .github/agents

# Copy templates
if [ ! -f "templates/agents/developer.agent.template.md" ]; then
  echo "❌ Error: templates/agents/ not found"
  echo "   Run this script from the aiknowsys directory"
  exit 1
fi

echo "📋 Copying agent templates..."
cp templates/agents/developer.agent.template.md .github/agents/developer.agent.md
cp templates/agents/architect.agent.template.md .github/agents/architect.agent.md

# Replace template variables
echo "🔧 Configuring agents for your project..."
sed -i "s|{{ESSENTIALS_FILE}}|$ESSENTIALS_FILE|g" .github/agents/developer.agent.md
sed -i "s|{{ESSENTIALS_FILE}}|$ESSENTIALS_FILE|g" .github/agents/architect.agent.md

# Prompt for project-specific guidelines
echo ""
echo "Do you want to add project-specific guidelines for the Developer agent?"
echo "(These will be added to the agent's instructions)"
read -p "Enter guidelines or press Enter to skip: " project_guidelines

if [ -n "$project_guidelines" ]; then
  sed -i "s|{{PROJECT_GUIDELINES}}|$project_guidelines|g" .github/agents/developer.agent.md
else
  sed -i "s|{{PROJECT_GUIDELINES}}|None specified|g" .github/agents/developer.agent.md
fi

# Copy README
echo "📚 Installing agent documentation..."
cp templates/agents/README.md .github/agents/README.md

# Verify installation
echo ""
echo "✅ Custom agents installed successfully!"
echo ""
echo "📍 Location: .github/agents/"
echo "   - developer.agent.md    (Primary implementer)"
echo "   - architect.agent.md    (Code reviewer)"
echo "   - README.md             (Usage guide)"
echo ""
echo "🚀 Usage in VS Code:"
echo "   @Developer <your request>     → Implements and auto-reviews"
echo "   @SeniorArchitect <file>       → Direct review request"
echo ""
echo "📖 Next steps:"
echo "   1. Review .github/agents/README.md for detailed workflow"
echo "   2. Customize review criteria in architect.agent.md if needed"
echo "   3. Ensure $ESSENTIALS_FILE exists and documents your patterns"
echo ""
echo "💡 Tip: The agents will auto-handoff for review. Just use @Developer!"
