import { GoogleGenAI } from "@google/genai";
import { StaffRecord } from "@/lib/validations/staff";
import { crmToolDeclarations, executeCrmTool, ToolExecutionContext } from "./crm-tools";
import { getIndiaTodayStr } from "@/lib/utils";

/**
 * ============================================================================
 * NEXT GEN DMA VENTURES CRM - GEMINI AI DATA ASSISTANT SERVICE
 * Server-side service using Google's official @google/genai SDK with
 * live read-only function calling, strict RBAC enforcement, and data protection.
 * ============================================================================
 */

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}

export interface GenerateChatOptions {
  message: string;
  history?: ChatMessage[];
  staffInfo?: {
    id?: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  authContext?: ToolExecutionContext;
}

export interface GenerateChatResult {
  success: boolean;
  reply?: string;
  model?: string;
  error?: string;
  isConfigError?: boolean;
  toolsUsed?: string[];
}

/**
 * Validates if the Gemini API key is configured in the server environment.
 */
export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key.trim().length > 0 &&
    !key.includes("your-gemini-api-key") &&
    !key.includes("placeholder")
  );
}

/**
 * Returns the configured Gemini model name.
 * Defaults to 'gemini-2.5-flash' unless specified by GEMINI_MODEL.
 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

/**
 * System instruction provided to Gemini for NEXT GEN DMA VENTURES CRM.
 */
function buildSystemInstruction(
  staffInfo?: GenerateChatOptions["staffInfo"],
  authContext?: ToolExecutionContext
): string {
  const todayIST = getIndiaTodayStr();
  const staffContext = staffInfo
    ? `You are speaking with ${staffInfo.name} (${staffInfo.role}${staffInfo.department ? `, ${staffInfo.department}` : ""}).`
    : "You are speaking with an authenticated CRM staff member.";

  const rolePrivilege = authContext?.isAdmin
    ? "This user has Administrator privileges with full access to all CRM operational modules."
    : `This user is logged in as an Employee (${staffInfo?.role || "Staff"}) with module-level permissions.`;

  return `You are the official AI Data Assistant for NEXT GEN DMA VENTURES CRM.
${staffContext}
${rolePrivilege}
Current Date & Time: Today is ${todayIST} (Indian Standard Time, Asia/Kolkata).

ABOUT NEXT GEN DMA VENTURES:
- Leading digital marketing, AI, and business management academy.
- Academic & vocational programs: Digital Marketing, Generative AI, Data Analytics, Performance Marketing, Full Stack, AutoCAD, Python, Java, UI/UX Design, and related certifications.
- CRM Operational Modules: Leads, Enquiries, Follow-up Management, Students, Courses, Batches, Admissions, Payments & Installments, Attendance, Counselling Sessions, Corporate Placements, Staff Management, Notifications, and Executive Reports.

LIVE CRM DATA TOOLS AVAILABLE:
You have direct, real-time access to 14 server-side read-only CRM querying tools:
1. crm_get_dashboard_summary - Overall real-time KPI metrics (leads, inquiries, students, admissions, fee collections this month, active batches, attendance, placements).
2. crm_get_leads - Query leads (status, counselor, course, dateFilter: today/overdue/upcoming, keyword search).
3. crm_get_enquiries - Query student inquiries (status, counselor, course, search).
4. crm_get_follow_ups - Query follow-up tasks (status, dateFilter: today/overdue/upcoming, counselor, priority).
5. crm_get_students - Query enrolled students (status, course, batchCode, paymentStatus, attendanceWatchlist <75%, search).
6. crm_get_courses - Academic course catalog and syllabus details.
7. crm_get_batches - Training cohorts, class schedules, timings, trainers, and seat availability.
8. crm_get_admissions - Student admission records, enrolled candidates, fees, and balances.
9. crm_get_payments - Tuition fee collections, payment methods, transaction receipts, and monthly revenue.
10. crm_get_attendance - Daily attendance sessions, batch attendance rates, and watchlist candidates.
11. crm_get_counselling - Counselling appointments, completed sessions, and admission conversions.
12. crm_get_placements - Partner hiring firms, job drives, and student placement offers.
13. crm_get_staff - Employee & faculty directory, department rosters, designations, and roles.
14. crm_get_notifications - Operational system notices and announcements.

CRITICAL OPERATIONAL RULES:
1. Always Use Live Tools for Factual Data: Whenever the user asks for counts, lists, summaries, revenue, dates, or specific records, invoke the appropriate CRM tool. Do NOT guess, invent, or estimate any numbers.
2. Factuality & Zero Hallucination: If a tool returns 0 matching records or an empty list, explicitly state that 0 records were found in the CRM.
3. Indian Currency: Always format monetary amounts in Indian Rupees using the ₹ symbol (e.g. ₹45,000, ₹1,20,000).
4. Strict Date Context: Respect India Standard Time (${todayIST}). "Today", "this week", and "this month" must align with current IST calendar calculations.
5. RBAC & Access Control: If a tool returns an error stating "Access Denied" or that permission is required for a module, explain politely and clearly that the employee's role does not have permission to view that module and they should consult their CRM Administrator.
6. Communication Style: Professional, concise, courteous, structured with clean Markdown (bullet points, bold headers, and clean tables when presenting lists).
7. Security: Never attempt or discuss raw SQL, backend code execution, or secret keys.`;
}

let cachedWorkingModel: string | null = null;

const FALLBACK_CHAIN = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

/**
 * Invokes Gemini models with timeout and multi-model fallback logic.
 */
async function callGeminiGenerate(
  ai: GoogleGenAI,
  modelName: string,
  contents: any[],
  systemInstruction: string,
  tools: any[]
): Promise<{ response: any; usedModel: string }> {
  const tryModel = async (model: string): Promise<any> => {
    return Promise.race([
      ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          tools,
          temperature: 0.1,
          maxOutputTokens: 1200,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini request to ${model} timed out after 60s.`)), 60000)
      ),
    ]);
  };

  const modelsToTry = [
    ...(cachedWorkingModel ? [cachedWorkingModel] : []),
    modelName,
    ...FALLBACK_CHAIN,
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;

  for (const candidateModel of modelsToTry) {
    try {
      const res = await tryModel(candidateModel);
      cachedWorkingModel = candidateModel;
      return { response: res, usedModel: candidateModel };
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || "");
      const isRecoverable =
        msg.includes("no longer available") ||
        msg.includes("404") ||
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("NOT_FOUND") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("429");

      if (isRecoverable) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Server-side chat completion using the official @google/genai SDK with function calling.
 */
export async function generateChatResponse(
  options: GenerateChatOptions
): Promise<GenerateChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!isGeminiConfigured() || !apiKey) {
    return {
      success: false,
      error:
        "GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your .env.local file to activate the AI assistant.",
      isConfigError: true,
    };
  }

  const baseModel = getGeminiModel();
  const authContext: ToolExecutionContext = options.authContext || {
    staff: (options.staffInfo as any) || null,
    isAdmin: options.staffInfo?.role === "Super Admin" || options.staffInfo?.role === "Admin",
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format conversation history into @google/genai contents structure
    const contents: any[] = [];

    if (options.history && Array.isArray(options.history)) {
      for (const item of options.history) {
        if (!item || !item.text) continue;
        const role = item.role === "model" || item.role === "assistant" ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: item.text.slice(0, 2000) }],
        });
      }
    }

    // Append the current user prompt
    contents.push({
      role: "user",
      parts: [{ text: options.message.slice(0, 2000) }],
    });

    const systemInstruction = buildSystemInstruction(options.staffInfo, authContext);
    const tools = [{ functionDeclarations: crmToolDeclarations }];

    let currentModel = baseModel;
    const toolsUsed: string[] = [];
    const maxToolTurns = 3;
    let turnCount = 0;

    // Execution loop: Handle model tool calls and feed responses back to Gemini
    while (turnCount < maxToolTurns) {
      turnCount++;
      const { response, usedModel } = await callGeminiGenerate(
        ai,
        currentModel,
        contents,
        systemInstruction,
        tools
      );
      currentModel = usedModel;

      const functionCalls = response?.functionCalls;

      // If no function calls, the model produced the final text reply
      if (!functionCalls || functionCalls.length === 0) {
        const reply = response?.text || "";
        return {
          success: true,
          reply: reply.trim() || "I have reviewed the CRM records for your inquiry.",
          model: currentModel,
          toolsUsed,
        };
      }

      // Add the model's message with tool calls to conversation history
      const candidateContent = response.candidates?.[0]?.content;
      if (candidateContent) {
        contents.push(candidateContent);
      }

      // Execute each function call through the secure server-side tool executor
      const toolResponseParts: any[] = [];

      for (const call of functionCalls) {
        const toolName = call.name;
        const toolArgs = (call.args as Record<string, any>) || {};
        toolsUsed.push(toolName);

        let executionResult: any;
        try {
          executionResult = await executeCrmTool(toolName, toolArgs, authContext);
        } catch (execError: any) {
          executionResult = {
            error: `Failed to execute tool '${toolName}': ${execError?.message || "Unknown error"}`,
          };
        }

        toolResponseParts.push({
          functionResponse: {
            id: call.id,
            name: toolName,
            response: {
              output: executionResult,
            },
          },
        });
      }

      // Send the tool execution results back to the model in the next turn
      contents.push({
        role: "user",
        parts: toolResponseParts,
      });
    }

    // If loop reached max turns, make one final call to generate natural language response
    const finalResult = await callGeminiGenerate(
      ai,
      currentModel,
      contents,
      systemInstruction,
      tools
    );

    return {
      success: true,
      reply: finalResult.response?.text || "Here is the summary of the requested CRM information.",
      model: finalResult.usedModel,
      toolsUsed,
    };
  } catch (error: any) {
    console.error("Gemini service error:", error?.message || error);

    const errorMsg = String(error?.message || "");

    if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID")) {
      return {
        success: false,
        error:
          "The configured GEMINI_API_KEY appears invalid or expired. Please verify your API key in Google AI Studio.",
        isConfigError: true,
      };
    }

    if (errorMsg.includes("quota") || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      return {
        success: false,
        error: "Gemini API rate limit or quota exceeded. Please wait a moment before trying again.",
      };
    }

    if (errorMsg.includes("timed out")) {
      return {
        success: false,
        error: "Request timed out while waiting for a response from Gemini. Please try again.",
      };
    }

    return {
      success: false,
      error:
        "An unexpected error occurred while communicating with the Gemini service. Please try again later.",
    };
  }
}
