import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/auth/server-auth";
import { generateChatResponse, getGeminiModel, isGeminiConfigured } from "@/lib/services/gemini-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, { message: "Message cannot be empty." })
    .max(2000, { message: "Message cannot exceed 2000 characters." }),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model", "assistant"]),
        text: z.string().max(2000),
      })
    )
    .max(20, { message: "History cannot exceed 20 messages." })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication & Active Employee Status
    const auth = await getAuthenticatedStaff(req);
    if (!auth.authenticated || !auth.staff) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Authentication required. Please sign in to use the AI Assistant.",
        },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Request Body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const validation = chatRequestSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        {
          success: false,
          error: issue,
        },
        { status: 400 }
      );
    }

    const { message, history } = validation.data;

    // 3. Check Server Environment Configuration
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your .env.local file to enable the assistant.",
          isConfigError: true,
          model: getGeminiModel(),
        },
        { status: 200 }
      );
    }

    // 4. Invoke Gemini Service with verified server-side staff and auth context
    const staff = auth.staff;
    const result = await generateChatResponse({
      message,
      history,
      staffInfo: {
        id: staff.id,
        name: staff.fullName,
        email: staff.email,
        role: staff.role,
        department: staff.department,
      },
      authContext: {
        staff: auth.staff,
        isAdmin: auth.isAdmin,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to generate AI response.",
          isConfigError: result.isConfigError || false,
        },
        { status: result.isConfigError ? 200 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: result.reply,
      model: result.model,
      toolsUsed: result.toolsUsed || [],
    });
  } catch (error: any) {
    console.error("API POST /api/assistant/chat error:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected internal error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
