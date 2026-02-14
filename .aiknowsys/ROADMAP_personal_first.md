# Roadmap: Personal First (Mini PC Focus)

**Philosophy:** "Big things start small" - Build for yourself, validate it works, then expand.

**Status:** 2026-02-14  
**Target:** You + Mini PC + AI happiness

---

## 🎯 Phase 1: Mini PC Setup (Week 1-2)

**Goal:** Get mini PC ready as central server

**Hardware acquisition:**
- [ ] Order mini PC (128GB RAM + AMD GPU with ROCm)
- [ ] Receive and unbox
- [ ] Initial setup (Ubuntu 24.04 LTS)

**Software installation:**
```bash
# 1. System updates
sudo apt update && sudo apt upgrade -y

# 2. Install ROCm (AMD GPU drivers)
# Follow: https://rocm.docs.amd.com/en/latest/deploy/linux/quick_start.html

# 3. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 4. Pull AI models
ollama pull llama3.3:70b      # Large model (40GB, production quality)
ollama pull llama3.2:3b        # Small model (fast, good enough)

# 5. Test GPU acceleration
ollama run llama3.3:70b "Hello from my mini PC!"
# Should see ~100 tokens/sec with GPU
```

**Validation:**
- [ ] GPU recognized by ROCm (`rocm-smi`)
- [ ] Ollama working (`ollama list`)
- [ ] Llama 70B runs fast (~100 tok/s)
- [ ] Mini PC accessible on network (`ping mini-pc.local`)

**Estimated time:** 1-2 days (mostly waiting for hardware)

---

## 🚀 Phase 2: Deploy MCP Server to Mini PC (Week 2)

**Goal:** Move MCP server from laptop to mini PC (centralized deployment)

**Tasks:**
- [ ] Clone AIKnowSys repo on mini PC
- [ ] Configure for HTTP transport (port 3100)
- [ ] Set up systemd service (auto-start on boot)
- [ ] Migrate existing `.aiknowsys/` data from laptop
- [ ] Configure laptop VSCode to connect to mini PC

**Implementation:**

```bash
# On mini PC
cd /opt
git clone https://github.com/arpa73/AIKnowSys.git aiknowsys
cd aiknowsys
npm install

# Create data directory
sudo mkdir -p /opt/aiknowsys-data/.aiknowsys/{sessions,plans,learned,reviews}
sudo chown -R $USER:$USER /opt/aiknowsys-data

# Copy existing data from laptop
# (On laptop)
cd ~/projects/knowledge-system-template
tar -czf aiknowsys-export.tar.gz .aiknowsys/
scp aiknowsys-export.tar.gz mini-pc:/opt/aiknowsys-data/

# (On mini PC)
cd /opt/aiknowsys-data
tar -xzf aiknowsys-export.tar.gz
npx aiknowsys migrate-to-sqlite  # Rebuild index

# Configure MCP server for HTTP
# Edit: mcp-server/config.json
{
  "transport": "http",
  "port": 3100,
  "host": "0.0.0.0",
  "dataPath": "/opt/aiknowsys-data/.aiknowsys",
  "aiProvider": "ollama",
  "ollamaUrl": "http://localhost:11434"
}

# Set up systemd service
sudo cp scripts/aiknowsys-mcp.service /etc/systemd/system/
sudo systemctl enable aiknowsys-mcp
sudo systemctl start aiknowsys-mcp

# Verify running
curl http://mini-pc.local:3100/health
# → { "status": "ok", "tools": 32 }
```

**Laptop configuration:**

```json
// .vscode/mcp.json (on laptop)
{
  "mcpServers": {
    "aiknowsys": {
      "transport": "sse",
      "url": "http://mini-pc.local:3100/messages"
    }
  }
}
```

**Validation:**
- [ ] MCP server running on mini PC (24/7)
- [ ] Laptop can connect via HTTP
- [ ] Desktop can connect (same knowledge base!)
- [ ] Tools work from both devices
- [ ] Data stays in sync automatically

**Estimated time:** 2-3 days

---

## ⚡ Phase 3: Quick Wins (Week 3)

**Goal:** Implement 3 immediate AI UX improvements (from PLAN_ai_ux_quick_wins.md)

**Priority:** HIGH (no hardware dependency, immediate value)

**Features:**
1. **Conversational errors** - AI-friendly error messages
2. **Progressive detail levels** - Preview → Metadata → Section → Full
3. **Optimization hints** - Guide agents to efficient queries

**Implementation:**
- [ ] Feature 1: AIFriendlyErrorBuilder class
- [ ] Feature 2: Response mode parameter (preview/metadata/section/full)
- [ ] Feature 3: Add hints to every tool response
- [ ] Update all 31 MCP tools with new patterns
- [ ] Test with Claude/GPT-4

**Validation:**
- [ ] Errors are conversational (not stack traces)
- [ ] Token usage reduced (agents use preview mode)
- [ ] Agents learn optimization patterns
- [ ] 164 tests still passing

**Estimated time:** 3-5 days

**Why do this now:**
- Works on laptop OR mini PC (no dependency)
- Immediate quality-of-life improvement
- Foundation for conversational mediator (Phase 4)

---

## 🧠 Phase 4: Conversational Mediator - Foundation (Week 4-5)

**Goal:** Build Phase 1 of conversational mediator (intent parsing + basic NLQ)

**Priority:** MEDIUM (requires mini PC for AI models)

**From:** PLAN_conversational_mediator.md

**Phase 1.1: Intent Parser (Days 1-3)**

```typescript
// New tool: conversational_query
export async function conversationalQuery(args: { query: string }) {
  // 1. Parse intent using Ollama (local, fast, free!)
  const intent = await ollama.chat({
    model: 'llama3.2:3b',  // Small model, good enough for parsing
    messages: [{
      role: 'system',
      content: 'You are an intent parser. Convert natural language to structured queries.'
    }, {
      role: 'user',
      content: args.query
    }]
  });

  // 2. Call existing storage functions (same as direct tools!)
  const result = await storage.querySessions(intent.params);

  // 3. Format conversationally
  const answer = await ollama.chat({
    model: 'llama3.3:70b',  // Large model for quality responses
    messages: [{
      role: 'system',
      content: 'Format these results conversationally'
    }, {
      role: 'user',
      content: JSON.stringify(result)
    }]
  });

  return {
    answer: answer.message.content,
    data: result,  // Still return raw data for agent
    usage: { model: 'llama3.3:70b', tokens: answer.usage.total_tokens }
  };
}
```

**Tasks:**
- [ ] Add Ollama client library
- [ ] Implement intent parser (3B model)
- [ ] Implement response formatter (70B model)
- [ ] Register as MCP tool
- [ ] Test with queries: "Show me MCP work this week"
- [ ] Measure token usage (should be lower than direct tools!)

**Validation:**
- [ ] Natural language queries work
- [ ] Calls same storage as direct tools (no duplication)
- [ ] Responses are conversational
- [ ] Still returns structured data for agents
- [ ] Tests passing (165 total, +1 new)

**Estimated time:** 5-7 days

**Why do this now:**
- Mini PC has AI models ready (Phase 2 complete)
- Quick wins foundation in place (Phase 3 complete)
- Single tool, low risk
- Immediate "wow" factor

---

## 🤖 Phase 5: Fine-Tune Custom Model (Week 6-7)

**Goal:** Train 1-3B model on AIKnowSys-specific queries (from PLAN_conversational_mediator.md)

**Priority:** MEDIUM (optional optimization, requires working mediator)

**Why fine-tune:**
- Llama 3.2 3B is generic (knows everything, masters nothing)
- Custom 1B trained on AIKnowSys is specialist (98% accuracy, 2x faster)
- No API costs (runs local forever)

**Training data sources:**
1. **Existing tests:** 200 examples (input → expected output)
2. **Session files:** 87 sessions with patterns
3. **Synthetic data:** GPT-4 generates 500 training examples
4. **Real usage:** Next 100 queries from actual use

**Total:** 800-1000 examples

**Fine-tuning process:**

```python
# On mini PC with ROCm GPU
from unsloth import FastLanguageModel
from datasets import Dataset

# 1. Load base model
model = FastLanguageModel.from_pretrained(
    "unsloth/Llama-3.2-1B-Instruct",
    max_seq_length=2048,
    load_in_4bit=True
)

# 2. Prepare for LoRA fine-tuning
model = FastLanguageModel.get_peft_model(
    model,
    r=16,  # LoRA rank
    target_modules=["q_proj", "v_proj"],
    lora_alpha=16,
    lora_dropout=0.05
)

# 3. Load training data
dataset = Dataset.from_json("aiknowsys-training-data.json")

# 4. Train (2-4 hours on mini PC GPU)
from trl import SFTTrainer

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    max_seq_length=2048,
    epochs=3
)

trainer.train()

# 5. Export to Ollama format
model.save_pretrained_merged("aiknowsys-1b", save_method="merged_16bit")

# 6. Create Ollama model
# Modelfile
FROM ./aiknowsys-1b
SYSTEM You are an AIKnowSys query assistant. Parse natural language into structured queries.

# Create model
ollama create aiknowsys:1b -f Modelfile
```

**Validation:**
- [ ] Model accuracy >95% on test set
- [ ] Inference speed >150 tok/s (faster than 3B)
- [ ] Memory usage <2GB (vs 3B = 6GB)
- [ ] Quality comparable to Llama 3.2 3B for AIKnowSys queries

**Estimated time:** 
- Data preparation: 2-3 days
- Training: 2-4 hours (on mini PC)
- Testing: 1 day

**Why do this:**
- Custom model = perfect for YOUR use case
- 2x faster than generic 3B
- Uses less RAM (can run alongside 70B)
- Educational (learn fine-tuning process)
- Bragging rights ("I trained my own AI!")

---

## 🧹 Phase 6: Autonomous Maintenance (Week 8+)

**Goal:** Let AI maintain itself (from PLAN_ai_autonomous_maintenance.md)

**Priority:** LOW (requires everything above, low urgency)

**Features:**
1. **Daily pattern extraction** (3 AM)
2. **Weekly maintenance** (Sunday 2 AM)
3. **Monthly framework updates** (1st of month)

**Why do this later:**
- Requires stable foundation (Phases 1-4)
- Not urgent (manual maintenance is fine for now)
- You'll have usage data to validate patterns

**When to implement:**
- After 1-2 months of mini PC usage
- When you notice repetitive patterns
- When maintenance becomes annoying

---

## 🏢 Phase 7: Corporate Features (Future)

**Goal:** Test with friends/colleagues, then productize

**Priority:** LOW (personal use first!)

**Approach:**
1. Use personal version for 3-6 months
2. Show to developer friends ("check out this cool thing!")
3. If they want it, help them set up (free, learn from them)
4. If 5-10 friends love it, offer to companies
5. If companies pay, build corporate features

**Why this order:**
- Personal use validates core value
- Friends provide free feedback
- Word-of-mouth is best marketing
- Only build corporate if there's demand

**Corporate vision is documented** (PLAN_ai_autonomous_maintenance.md) but NOT on immediate roadmap.

---

## 📊 Success Criteria

### Phase 1-2: Mini PC Setup (Week 1-2)
- [x] Mini PC running 24/7
- [x] MCP server accessible from laptop AND desktop
- [x] Same knowledge base everywhere
- [x] AI inference fast (~100 tok/s with 70B)

### Phase 3: Quick Wins (Week 3)
- [x] Errors are conversational, not cryptic
- [x] Agents use preview mode (lower tokens)
- [x] Optimization hints working
- [x] Noticeable UX improvement

### Phase 4: Mediator Foundation (Week 4-5)
- [x] Natural language queries work
- [x] "Show me MCP work this week" returns correct results
- [x] Responses conversational
- [x] Token usage lower than direct tools

### Phase 5: Fine-Tuned Model (Week 6-7)
- [x] Custom 1B model trained
- [x] Accuracy >95% on AIKnowSys queries
- [x] Faster than generic 3B
- [x] Runs alongside 70B (memory efficient)

### Phase 6+: Autonomous (Week 8+)
- [x] System learns patterns automatically
- [x] Maintenance runs without thinking
- [x] Framework updates catch API changes
- [x] Zero manual effort

---

## 🎯 Near-Term Focus (Next 2 Weeks)

**This week (Week 1):**
- Order mini PC hardware
- While waiting: Implement Quick Wins (Phase 3)
  - No hardware dependency
  - Immediate value on laptop
  - Foundation for mediator

**Next week (Week 2):**
- Receive mini PC
- Setup (Ubuntu + ROCm + Ollama)
- Deploy MCP server centrally
- Test from laptop and desktop
- CELEBRATE! 🎉

**Week 3-4:**
- Build conversational mediator foundation
- First natural language query working
- "OMG this is actually useful!"

**Week 5+:**
- Fine-tune if interested
- Autonomous maintenance if annoying
- Share with friends if proud

---

## 💡 Key Principles

1. **Personal first** - Build for yourself, validate value
2. **Small iterations** - Ship phases, not big bang
3. **Usage validates** - Real use reveals what matters
4. **Corporate later** - Only if friends want it
5. **No pressure** - This is YOUR tool, YOUR pace

**Quote:** "Big things start small" - Steve Jobs built Apple in a garage, Linus built Linux for himself.

**You're building AIKnowSys for YOU. If others want it later, great. But that's not the goal yet.**

---

**Status:** ACTIVE (personal roadmap)  
**Updated:** 2026-02-14  
**Next milestone:** Mini PC hardware ordered ✅
