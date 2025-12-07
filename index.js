export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Endi GET so‘rov ishlaydi: /download?repo_url=...
    if (url.pathname === "/download" && request.method === "GET") {
      const repo_url = url.searchParams.get("repo_url");

      if (!repo_url) {
        return new Response(JSON.stringify({ error: "repo_url majburiy!" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        let downloadUrl;
        let repoName;

        // GitHub
        if (repo_url.includes("github.com")) {
          const match = repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (!match) throw new Error("Noto‘g‘ri GitHub URL");
          const owner = match[1];
          repoName = match[2];
          downloadUrl = `https://api.github.com/repos/${owner}/${repoName}/zipball`;
        }

        // GitLab
        else if (repo_url.includes("gitlab.com")) {
          const match = repo_url.match(/gitlab\.com\/([^\/]+\/[^\/]+)/);
          if (!match) throw new Error("Noto‘g‘ri GitLab URL");
          repoName = match[1].split("/").pop();
          // GitLab API zip download
          downloadUrl = `https://gitlab.com/${match[1]}/-/archive/master/${repoName}-master.zip`;
        }

        // Bitbucket
        else if (repo_url.includes("bitbucket.org")) {
          const match = repo_url.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)/);
          if (!match) throw new Error("Noto‘g‘ri Bitbucket URL");
          const owner = match[1];
          repoName = match[2];
          downloadUrl = `https://bitbucket.org/${owner}/${repoName}/get/master.zip`;
        }

        else {
          throw new Error("Hozircha faqat GitHub, GitLab va Bitbucket qo‘llab-quvvatlanadi");
        }

        // Repo zip yuklab olish
        const resp = await fetch(downloadUrl, {
          headers: { "User-Agent": "Cloudflare-Worker" },
        });

        if (!resp.ok) {
          return new Response(JSON.stringify({ error: "Repo yuklab bo‘lmadi" }), {
            status: resp.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Fayl nomi majburiy Realix prefiksi bilan
        const fileName = `Realix-${repoName}.zip`;

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
