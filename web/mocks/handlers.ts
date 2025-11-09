import { http, HttpResponse } from "msw";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const handlers = [
  // Create track
  http.post(`${API_BASE_URL}/api/tracks`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      track_id: Math.floor(Math.random() * 1000),
      job_id: Math.floor(Math.random() * 1000),
      credits_required: Math.ceil((body.duration || 60) / 60),
    });
  }),

  // Get job status
  http.get(`${API_BASE_URL}/api/jobs/:id`, ({ params }) => {
    const id = params.id as string;
    const progress = Math.min(100, Math.floor(Math.random() * 100));
    const status =
      progress === 100
        ? "COMPLETE"
        : progress > 0
        ? "RENDERING"
        : "QUEUED";

    return HttpResponse.json({
      id: parseInt(id),
      track_id: parseInt(id),
      status,
      progress,
      eta: status === "RENDERING" ? Math.floor(Math.random() * 60) : undefined,
    });
  }),

  // Get track
  http.get(`${API_BASE_URL}/api/tracks/:id`, ({ params }) => {
    const id = params.id as string;
    return HttpResponse.json({
      id: parseInt(id),
      title: `Track ${id}`,
      prompt: "Mock track generated for testing",
      status: "COMPLETE",
      preview_url: `https://example.com/preview/${id}.mp3`,
      file_url: `https://example.com/file/${id}.wav`,
      created_at: new Date().toISOString(),
      credits_required: 1,
      public: false,
    });
  }),

  // Analyze reference
  http.post(`${API_BASE_URL}/api/analyze/reference`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    return HttpResponse.json({
      bpm: 120,
      key: "C",
      loudness: -14.5,
      file_id: Math.floor(Math.random() * 1000),
    });
  }),

  // Get credits
  http.get(`${API_BASE_URL}/api/credits`, () => {
    return HttpResponse.json({
      credits: 100,
      plan: "free",
      pricing_breakdown: {
        credit_packs: {
          starter: { credits: 10, price: 9.99 },
          pro: { credits: 50, price: 39.99 },
          enterprise: { credits: 200, price: 149.99 },
        },
      },
    });
  }),

  // Purchase credits
  http.post(`${API_BASE_URL}/api/credits/purchase`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      checkout_url: `https://checkout.stripe.com/test/${Math.random()}`,
      session_id: `cs_test_${Math.random()}`,
    });
  }),

  // Publish track
  http.post(`${API_BASE_URL}/api/tracks/:id/publish`, ({ params }) => {
    const id = params.id as string;
    return HttpResponse.json({
      success: true,
      share_url: `https://soundfoundry.app/share/${id}`,
    });
  }),
];

