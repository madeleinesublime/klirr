// Serves the apple-touch-icon by redirecting to the generated /icon endpoint.
// iOS follows redirects for apple-touch-icon, so this works correctly.
export async function GET(request: Request) {
  const iconUrl = new URL('/icon', request.url)
  return Response.redirect(iconUrl.toString(), 307)
}
