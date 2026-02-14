#!/usr/bin/env node
/**
 * Skill Auto-Detector Hook (userPromptSubmitted event)
 * 
 * Analyzes user prompts BEFORE AI processes them and automatically
 * loads relevant skills to guide the AI's response.
 * 
 * Benefits:
 * - Proactive skill loading (AI knows workflow before responding)
 * - User awareness (see which skills are active)
 * - Context continuity (remembers last skill used)
 * - Smart recommendations (suggests relevant skills)
 * 
 * Non-blocking: Always exits with code 0
 * Timeout: Must complete within 2 seconds
 */

const fs = require('fs');
const path = require('path');

async function main() {
  let input = '';
  
  process.stdin.on('data', chunk => input += chunk.toString());
  
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      
      const userMessage = data.userMessage || data.prompt || '';
      if (!userMessage) {
        process.exit(0);
        return;
      }
      
      // Load configuration
      const config = loadConfig();
      if (!config.skillDetection?.enabled) {
        process.exit(0);
        return;
      }
      
      // Detect matching skills
      const matchedSkills = detectSkills(userMessage, config.skills);
      
      // Check conversation context for continuity
      const contextSkill = detectContextContinuation(data, config);
      if (contextSkill) {
        matchedSkills.unshift(contextSkill); // Prioritize context
      }
      
      // Remove duplicates
      const uniqueSkills = deduplicateSkills(matchedSkills);
      
      if (uniqueSkills.length === 0) {
        // Try fuzzy matching for recommendations
        if (config.skillDetection.showRecommendations) {
          const recommendations = fuzzyMatchSkills(userMessage, config.skills);
          if (recommendations.length > 0) {
            console.error('[Skills] 💡 No exact match, but consider:');
            recommendations.forEach(skill => {
              console.error(`[Skills]   - ${skill.name}: ${skill.description}`);
            });
          }
        }
        process.exit(0);
        return;
      }
      
      // Output detected skills
      const autoLoad = uniqueSkills.filter(s => s.autoLoad);
      const confirm = uniqueSkills.filter(s => s.requiresConfirmation);
      
      if (autoLoad.length > 0) {
        console.error('[Skills] 📚 Auto-loaded: ' + autoLoad.map(s => s.name).join(', '));
        console.error('[Skills] AI will follow these workflows automatically');
        autoLoad.forEach(skill => {
          console.error(`[Skills]   - ${skill.name}: ${skill.description}`);
          console.error(`[Skills]     Path: .github/skills/${skill.path}`);
        });
      }
      
      if (confirm.length > 0) {
        console.error('[Skills] ⚠️  Requires confirmation: ' + confirm.map(s => s.name).join(', '));
        console.error('[Skills] These skills suggest careful review before proceeding');
        confirm.forEach(skill => {
          console.error(`[Skills]   - ${skill.name}: ${skill.description}`);
        });
      }
      
      // Track usage for analytics
      if (config.skillDetection.trackUsage) {
        trackSkillUsage(uniqueSkills);
      }
      
      process.exit(0);
    } catch (err) {
      // Fail silently
      process.exit(0);
    }
  });
}

/**
 * Load hook configuration
 */
function loadConfig() {
  const configPath = path.join('.github', 'hooks', 'config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return mergeWithDefaults(config);
    } catch (err) {
      // Fall back to defaults
    }
  }
  
  return getDefaultConfig();
}

/**
 * Detect skills based on user prompt
 */
function detectSkills(userMessage, skillsConfig) {
  const matched = [];
  const messageLower = userMessage.toLowerCase();
  
  for (const [skillName, skillConfig] of Object.entries(skillsConfig)) {
    const triggers = skillConfig.triggers?.keywords || [];
    
    // Check if any trigger keyword matches
    const keywordMatch = triggers.some(trigger => 
      messageLower.includes(trigger.toLowerCase())
    );
    
    if (keywordMatch) {
      matched.push({
        name: skillName,
        ...skillConfig,
        matchType: 'keyword'
      });
    }
  }
  
  return matched;
}

/**
 * Detect if user is continuing previous work
 */
function detectContextContinuation(data, config) {
  const conversation = data.conversation || [];
  const depth = config.skillDetection?.conversationContextDepth || 5;
  
  // Look at recent messages
  const recentMessages = conversation.slice(-depth);
  
  // Find last skill mentioned
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i];
    const content = msg.content || msg.text || '';
    
    // Check for skill file reads
    const skillMatch = content.match(/\.github\/skills\/([\w-]+)\/SKILL\.md/);
    if (skillMatch) {
      const skillName = skillMatch[1];
      if (config.skills[skillName]) {
        return {
          name: skillName,
          ...config.skills[skillName],
          matchType: 'context'
        };
      }
    }
  }
  
  return null;
}

/**
 * Fuzzy match for recommendations
 */
function fuzzyMatchSkills(userMessage, skillsConfig) {
  const recommendations = [];
  const words = userMessage.toLowerCase().split(/\s+/);
  
  for (const [skillName, skillConfig] of Object.entries(skillsConfig)) {
    const triggers = skillConfig.triggers?.keywords || [];
    
    // Calculate similarity score
    let score = 0;
    for (const trigger of triggers) {
      const triggerWords = trigger.toLowerCase().split(/\s+/);
      for (const word of words) {
        for (const triggerWord of triggerWords) {
          if (levenshteinDistance(word, triggerWord) <= 2) {
            score++;
          }
        }
      }
    }
    
    if (score > 0) {
      recommendations.push({
        name: skillName,
        description: skillConfig.description,
        score
      });
    }
  }
  
  // Return top 3 recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Track skill usage for analytics
 */
function trackSkillUsage(skills) {
  const analyticsPath = path.join('.aiknowsys', 'skill-usage.json');
  
  let analytics = { skills: {} };
  if (fs.existsSync(analyticsPath)) {
    try {
      analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf-8'));
    } catch (err) {
      // Start fresh
    }
  }
  
  const timestamp = new Date().toISOString();
  
  skills.forEach(skill => {
    if (!analytics.skills[skill.name]) {
      analytics.skills[skill.name] = {
        count: 0,
        firstUsed: timestamp,
        lastUsed: timestamp
      };
    }
    
    analytics.skills[skill.name].count++;
    analytics.skills[skill.name].lastUsed = timestamp;
  });
  
  try {
    if (!fs.existsSync('.aiknowsys')) {
      fs.mkdirSync('.aiknowsys', { recursive: true });
    }
    fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
  } catch (err) {
    // Silent fail - analytics is optional
  }
}

/**
 * Remove duplicate skills (keep highest priority)
 */
function deduplicateSkills(skills) {
  const seen = new Map();
  
  for (const skill of skills) {
    if (!seen.has(skill.name) || skill.matchType === 'context') {
      seen.set(skill.name, skill);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Merge user config with defaults
 */
function mergeWithDefaults(userConfig) {
  const defaults = getDefaultConfig();
  
  return {
    ...defaults,
    ...userConfig,
    skills: {
      ...defaults.skills,
      ...userConfig.skills
    },
    skillDetection: {
      ...defaults.skillDetection,
      ...userConfig.skillDetection
    }
  };
}

/**
 * Get default configuration
 */
function getDefaultConfig() {
  return {
    skillDetection: {
      enabled: true,
      showRecommendations: true,
      trackUsage: true,
      conversationContextDepth: 5
    },
    skills: {
      'code-refactoring': {
        path: 'code-refactoring/SKILL.md',
        triggers: { keywords: ['refactor', 'clean up', 'simplify'] },
        autoLoad: true,
        priority: 'high',
        description: 'Test-driven refactoring workflow'
      },
      'feature-implementation': {
        path: 'feature-implementation/SKILL.md',
        triggers: { keywords: ['add command', 'new feature', 'implement'] },
        autoLoad: true,
        priority: 'high',
        description: 'Feature implementation workflow'
      }
    }
  };
}

main();
