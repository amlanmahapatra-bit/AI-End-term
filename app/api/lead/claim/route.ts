import { applyAction, confirmPage } from "@/lib/lead-action";

export const runtime = "nodejs";
export const GET = (req: Request) => confirmPage("claim", req);
export const POST = (req: Request) => applyAction("claim", req);
