import "server-only";
import { neon } from "@neondatabase/serverless";

// HTTP-based driver — works from Vercel's serverless/edge functions without
// connection pooling headaches. `DATABASE_URL` is auto-injected by the
// Neon (Vercel Marketplace) integration connected to this project.
export const sql = neon(process.env.DATABASE_URL!);
