export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // GET so‘rov: /download?repo_url=...&git_hub_token=...
    if (url.pathname === "/download" && request.method === "GET") {
      const repo_url = url.searchParams.get("repo_url");
      const gitHubToken = url.searchParams.get("git_hub_token");

      if (!repo_url) {
        return new Response(JSON.stringify({ error: "repo_url majburiy!" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        // GitHub repo URL dan owner va repo nomini ajratamiz
        const match = repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
          return new Response(JSON.stringify({ error: "Noto‘g‘ri GitHub URL" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const owner = match[1];
        const repo = match[2];

        // GitHub API orqali repo zip yuklab olish
        const githubApi = `https://api.github.com/repos/${owner}/${repo}/zipball`;

        // Headerlar
        const headers = { "User-Agent": "Cloudflare-Worker" };
        if (gitHubToken) {
          headers["Authorization"] = `Bearer ${gitHubToken}`;
        }

        const resp = await fetch(githubApi, { headers });

        if (!resp.ok) {
          return new Response(JSON.stringify({ error: "GitHub API xatosi yoki token noto‘g‘ri" }), {
            status: resp.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Fayl nomi majburiy Realix prefiksi bilan
        const fileName = `Realix-${repo}.zip`;

        return new Response(await resp.arrayBuffer(), {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename=${fileName}`,
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
