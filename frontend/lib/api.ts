const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type UserOut = {
  id: string;
  email: string;
  full_name: string | null;
  plan: "free" | "pro";
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: UserOut;
};

export type Match = {
  source_type: "web" | "own_submission" | "reference_corpus";
  source_reference: string;
  matched_excerpt: string;
  similarity_score: number;
};

export type CheckResult = {
  check_id: string;
  status: string;
  originality_score: number | null;
  ai_likelihood_score: number | null;
  ai_confidence_band: "low" | "moderate" | "high" | null;
  result_json: {
    note?: string;
    low_confidence?: boolean;
    low_confidence_reason?: string | null;
    ai_text_reasons?: string[];
    matches?: Match[];
    provenance?: { has_manifest: boolean; manifest: string | null };
  } | null;
  created_at: string;
};

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

export type SignupResult = { message: string; email: string };
export type MessageResult = { message: string };

export async function signup(email: string, password: string, fullName?: string): Promise<SignupResult> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName || null }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function verifyEmail(email: string, code: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function resendOtp(email: string): Promise<MessageResult> {
  const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function forgotPassword(email: string): Promise<MessageResult> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<MessageResult> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function googleSignIn(idToken: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function checkText(token: string, text: string): Promise<CheckResult> {
  const res = await fetch(`${API_BASE_URL}/check/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function checkDocument(token: string, file: File): Promise<CheckResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/check/document`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export type FeedbackItem = { sentence: string; issues: string[] };
export type FeedbackResult = { sentence_count: number; flagged_count: number; feedback: FeedbackItem[] };

export async function checkImage(token: string, file: File): Promise<CheckResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/check/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function checkBulk(token: string, files: File[]): Promise<CheckResult[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await fetch(`${API_BASE_URL}/check/bulk`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function checkWritingFeedback(token: string, text: string): Promise<FeedbackResult> {
  const res = await fetch(`${API_BASE_URL}/feedback/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export type CreateOrderResult = { order_id: string; amount: number; currency: string; key_id: string };

export async function createProOrder(token: string): Promise<CreateOrderResult> {
  const res = await fetch(`${API_BASE_URL}/billing/create-order`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export type CheckHistoryItem = {
  check_id: string;
  status: string;
  originality_score: number | null;
  ai_likelihood_score: number | null;
  original_filename: string | null;
  created_at: string;
};

export async function listChecks(token: string): Promise<CheckHistoryItem[]> {
  const res = await fetch(`${API_BASE_URL}/check`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export async function getCheck(token: string, checkId: string): Promise<CheckResult> {
  const res = await fetch(`${API_BASE_URL}/check/${checkId}`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}

export function reportPdfUrl(checkId: string): string {
  return `${API_BASE_URL}/check/${checkId}/pdf`;
}

export type BillingStatus = { plan: "free" | "pro"; status: string };

export async function getBillingStatus(token: string): Promise<BillingStatus> {
  const res = await fetch(`${API_BASE_URL}/billing/status`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!res.ok) throw new ApiError(await parseErrorDetail(res));
  return res.json();
}
