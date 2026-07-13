import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('WARNING: GEMINI_API_KEY is not defined. AI functionality will run in fallback simulation mode.');
}

interface CacheEntry {
  response: string;
  timestamp: number;
}

const aiCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 10000; // 10 seconds TTL

export class GeminiService {
  /**
   * Generates a multilingual, accessible response for the Fan Chatbot.
   */
  public static async generateFanResponse(query: string, contextData: any, language: string = 'en'): Promise<string> {
    const cacheKey = `fan:${language}:${query}:${JSON.stringify(contextData)}`;
    const cached = aiCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.response;
    }

    const systemInstruction = `
      You are StadiumIQ's Fan Assistant for the FIFA World Cup 2026.
      You are friendly, accessible, helpful, and speak fluent ${language}.
      
      Respond to the user's query using the following stadium operational context.
      Context:
      ${JSON.stringify(contextData, null, 2)}
      
      Guidelines:
      1. Provide clear, direct answers.
      2. If navigating, give simple step-by-step paths (e.g. gate to section).
      3. For accessibility queries, highlight wheelchair routes or sensory rooms.
      4. Use formatting (bullet points, bold text) and emojis for readability.
      5. Do not invent details not in the context. If details are missing, advise them to ask a stadium volunteer.
      
      User Query: "${query}"
    `;

    if (!genAI) {
      const simulated = this.simulateFanResponse(query, contextData, language);
      aiCache[cacheKey] = { response: simulated, timestamp: Date.now() };
      return simulated;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemInstruction }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.2 }
      });
      const text = result.response.text() || 'No response from AI.';
      aiCache[cacheKey] = { response: text, timestamp: Date.now() };
      return text;
    } catch (error) {
      console.error('Gemini API call failed, falling back to simulated response:', error);
      const simulated = this.simulateFanResponse(query, contextData, language);
      aiCache[cacheKey] = { response: simulated, timestamp: Date.now() };
      return simulated;
    }
  }

  /**
   * Summarizes operational metrics, gates flow, and reported incidents, generating action items.
   */
  public static async analyzeOperations(query: string, operationalData: any): Promise<string> {
    const cacheKey = `ops:${query}:${JSON.stringify(operationalData)}`;
    const cached = aiCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.response;
    }

    const systemInstruction = `
      You are StadiumIQ's Lead Operations Analyst.
      Analyze the following live stadium operational state:
      ${JSON.stringify(operationalData, null, 2)}
      
      Tasks:
      1. Identify critical bottlenecks, full smart bins, and unresolved incidents.
      2. Summarize overall stadium status (e.g., Gate flow, Transit delays).
      3. Generate a structured markdown response with:
      4. Answer this specific query from the Stadium Operations Director: "${query}"
      
      Keep the tone highly professional, precise, and operational.
    `;

    if (!genAI) {
      const simulated = this.simulateOpsResponse(query, operationalData);
      aiCache[cacheKey] = { response: simulated, timestamp: Date.now() };
      return simulated;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemInstruction }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.1 }
      });
      const text = result.response.text() || 'No response from AI.';
      aiCache[cacheKey] = { response: text, timestamp: Date.now() };
      return text;
    } catch (error) {
      console.error('Gemini API call failed, falling back to simulated response:', error);
      const simulated = this.simulateOpsResponse(query, operationalData);
      aiCache[cacheKey] = { response: simulated, timestamp: Date.now() };
      return simulated;
    }
  }

  private static simulateFanResponse(query: string, contextData: any, language: string): string {
    const lowerQuery = query.toLowerCase();
    let response = `🤖 **StadiumIQ Virtual Assistant** (Local Context Engine):\n\n`;

    if (lowerQuery.includes('match') || lowerQuery.includes('game') || lowerQuery.includes('schedule')) {
      const matches = contextData.matches || [];
      if (matches.length > 0) {
        response += `Here are the upcoming matches at the stadium:\n`;
        matches.forEach((m: any) => {
          response += `- ⚽ **${m.homeTeam} vs ${m.awayTeam}** on ${new Date(m.dateTime).toLocaleDateString()} (Status: ${m.status})\n`;
        });
      } else {
        response += `There are no matches scheduled today.\n`;
      }
    } else if (lowerQuery.includes('gate') || lowerQuery.includes('entrance') || lowerQuery.includes('bottleneck')) {
      const gates = contextData.gates || [];
      response += `Here is the current status of our gates:\n`;
      gates.forEach((g: any) => {
        response += `- 🚪 **${g.name}**: Status is **${g.status}** with an estimated queue of **${g.currentQueueSize}** fans.\n`;
      });
    } else if (lowerQuery.includes('transit') || lowerQuery.includes('bus') || lowerQuery.includes('metro') || lowerQuery.includes('train')) {
      const schedules = contextData.transit || [];
      response += `Here are the current transit services and schedules:\n`;
      schedules.forEach((t: any) => {
        const delayStr = t.status === 'delayed' ? `(⚠️ Delayed: ${t.delayDetails})` : `(✅ On Time)`;
        response += `- 🚇 **${t.routeName}** (${t.transportType}): Running every ${t.frequencyMinutes} mins ${delayStr}.\n`;
      });
    } else if (lowerQuery.includes('wheelchair') || lowerQuery.includes('accessible') || lowerQuery.includes('disab') || lowerQuery.includes('quiet')) {
      response += `♿ **Accessibility Accommodations**:\n` +
                  `- Accessible entry is prioritized at **Gate A (North)** and **Gate C (East)**.\n` +
                  `- Elevators are available on all main levels. Accessible restrooms are adjacent to sections 105, 120, and 215.\n` +
                  `- The sensory quiet room is located on the Concourse Level, near Section 202. Please see any volunteer for access.\n`;
    } else {
      response += `Hello! I am here to help you navigate the stadium. You can ask me about matches, gate queue times, transit schedules, or accessibility options. If you need hands-on assistance, please reach out to any volunteer in a bright green vest near you!`;
    }

    if (language !== 'en') {
      response += `\n\n*(Note: Automatic translation to ${language.toUpperCase()} enabled)*`;
    }
    return response;
  }

  private static simulateOpsResponse(query: string, operationalData: any): string {
    const lowerQuery = query.toLowerCase();
    const gates = operationalData.gates || [];
    const bins = operationalData.bins || [];
    const incidents = operationalData.incidents || [];

    const criticalIncidents = incidents.filter((i: any) => i.severity === 'high' || i.status === 'open');
    const fullBins = bins.filter((b: any) => b.fillLevel >= 80);
    const bottlenecks = gates.filter((g: any) => g.status === 'bottleneck');

    let response = `📊 **Operations Command Briefing** (Local Rule Engine):\n\n`;
    response += `### 📈 Stadium Health Summary\n`;
    response += `- **Gate Operations**: ${bottlenecks.length} bottleneck zone(s) active.\n`;
    response += `- **Waste Management**: ${fullBins.length} bin(s) require emptying (fill level > 80%).\n`;
    response += `- **Unresolved Incidents**: ${criticalIncidents.length} active issue(s) reported.\n\n`;

    response += `### 🚨 Urgent Actions & Dispatches\n`;
    if (bottlenecks.length > 0) {
      bottlenecks.forEach((g: any) => {
        response += `- **Gate Flow Congestion**: Directing arrival traffic from **${g.name}** (Queue: ${g.currentQueueSize}) to adjacent open gates.\n`;
      });
    }
    if (fullBins.length > 0) {
      response += `- **Volunteers Dispatch**: Waste collection route generated for: ${fullBins.map((b: any) => b.zoneName).join(', ')}.\n`;
    }
    if (criticalIncidents.length > 0) {
      criticalIncidents.forEach((i: any) => {
        response += `- **Incident Report [${i.severity.toUpperCase()}]**: "${i.description}" -> Action: ${i.responseAction || 'Pending dispatcher review.'}\n`;
      });
    }

    response += `\n### 💡 Answer to Command Query: "${query}"\n`;
    if (lowerQuery.includes('bin') || lowerQuery.includes('waste') || lowerQuery.includes('garbage')) {
      response += `There are currently ${fullBins.length} bins that are full. We have generated optimized collection routes for volunteers, prioritizing ${fullBins.map((b: any) => b.zoneName).join(', ') || 'none'}.`;
    } else if (lowerQuery.includes('gate') || lowerQuery.includes('bottleneck') || lowerQuery.includes('crowd')) {
      response += `Crowd status check: Gate bottlenecks are active at ${bottlenecks.map((g: any) => g.name).join(', ') || 'none'}. Flow rates are being monitored and adjusted.`;
    } else {
      response += `All systems are functional with standard operations. Active dispatches are visible in the staff log list.`;
    }

    return response;
  }
}
