export async function GET() {
  return new Response(JSON.stringify({}), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
