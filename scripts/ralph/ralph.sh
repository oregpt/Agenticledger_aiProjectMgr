#!/bin/bash
# Ralph - Autonomous AI Coding Loop
# Runs Claude Code repeatedly until all user stories pass
# Based on the Ralph pattern by @GeoffreyHuntley

set -e

# Configuration
MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Ralph - Autonomous Coding Loop${NC}"
echo -e "${BLUE}  Max iterations: ${MAX_ITERATIONS}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verify required files exist
if [ ! -f "$SCRIPT_DIR/prompt.md" ]; then
    echo -e "${RED}Error: prompt.md not found in $SCRIPT_DIR${NC}"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/prd.json" ]; then
    echo -e "${RED}Error: prd.json not found in $SCRIPT_DIR${NC}"
    exit 1
fi

# Create progress.txt if it doesn't exist
if [ ! -f "$SCRIPT_DIR/progress.txt" ]; then
    echo "# Ralph Progress Log" > "$SCRIPT_DIR/progress.txt"
    echo "Started: $(date '+%Y-%m-%d %H:%M')" >> "$SCRIPT_DIR/progress.txt"
    echo "" >> "$SCRIPT_DIR/progress.txt"
fi

# The loop
for i in $(seq 1 $MAX_ITERATIONS); do
    echo -e "${YELLOW}══════ Iteration $i of $MAX_ITERATIONS ══════${NC}"

    # Run Claude Code with the prompt
    # Using --dangerously-skip-permissions for autonomous operation
    OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" \
        | claude --dangerously-skip-permissions 2>&1 \
        | tee /dev/stderr) || true

    # Check if all stories are complete
    if echo "$OUTPUT" | \
        grep -q "<promise>COMPLETE</promise>"
    then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  Ralph completed all tasks!${NC}"
        echo -e "${GREEN}  Completed at iteration $i of $MAX_ITERATIONS${NC}"
        echo -e "${GREEN}========================================${NC}"
        exit 0
    fi

    echo -e "${BLUE}Iteration $i complete. Continuing...${NC}"
    echo ""

    # Small delay between iterations
    sleep 2
done

echo -e "${RED}========================================${NC}"
echo -e "${RED}  Max iterations reached${NC}"
echo -e "${RED}  Some stories may still be incomplete${NC}"
echo -e "${RED}========================================${NC}"
exit 1
