import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

function generateMockUsers(username: string) {
  const cleanName = username.trim();
  const avatarList = [
    "https://images.rbxcdn.com/3932cfeb24b95eb83e6ffb548b111532.png", // Default Roblox
    "https://images.rbxcdn.com/f11e96a40a83e6015b31df83df7d9b9d.png", // Builderman
    "https://images.rbxcdn.com/7123ef6df5ab86e24b9d03c625ec1d2c.png", // Baszucki
    "https://images.rbxcdn.com/c102a0b4d40224b11f58df4d9d10e9f1.png"  // Linkmon
  ];
  
  return [
    {
      id: 10293122,
      username: cleanName,
      displayName: cleanName,
      hasVerifiedBadge: true,
      avatarUrl: avatarList[0],
    },
    {
      id: 48591234,
      username: `${cleanName}Pro`,
      displayName: `${cleanName}⚡Pro`,
      hasVerifiedBadge: false,
      avatarUrl: avatarList[1],
    },
    {
      id: 98124012,
      username: `${cleanName}_Blox`,
      displayName: `${cleanName} Blox`,
      hasVerifiedBadge: false,
      avatarUrl: avatarList[2],
    },
    {
      id: 22894105,
      username: `TheReal_${cleanName}`,
      displayName: `★ ${cleanName} ★`,
      hasVerifiedBadge: true,
      avatarUrl: avatarList[3],
    }
  ];
}

  // API Route: Search Roblox users and get their avatars
  app.get("/api/roblox/search", async (req, res) => {
    try {
      const username = req.query.username;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "Username parameter is required" });
      }

      // 1. Search Roblox users. Roblox strictly requires limit to be 10, 25, 50, or 100. Let's use 10.
      const searchUrl = `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) {
        throw new Error(`Roblox Search API error: ${searchRes.statusText}`);
      }
      const searchData = (await searchRes.json()) as { data: any[] };

      if (!searchData.data || searchData.data.length === 0) {
        const fallbacks = generateMockUsers(username);
        return res.json({ data: fallbacks, isFallback: true });
      }

      // 2. Fetch avatars in batch
      const userIds = searchData.data.map((u) => u.id).join(",");
      const avatarUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds}&size=150x150&format=Png&isCircular=false`;
      const avatarRes = await fetch(avatarUrl);
      const avatarsMap: Record<number, string> = {};

      if (avatarRes.ok) {
        const avatarData = (await avatarRes.json()) as { data: any[] };
        if (avatarData.data) {
          avatarData.data.forEach((item) => {
            avatarsMap[item.targetId] = item.imageUrl;
          });
        }
      }

      // 3. Combine search data with avatars
      const richUsers = searchData.data.map((u) => ({
        id: u.id,
        username: u.name,
        displayName: u.displayName,
        hasVerifiedBadge: u.hasVerifiedBadge,
        avatarUrl: avatarsMap[u.id] || "https://tr.rbxcdn.com/30day-avatar-headshot/150/150/AvatarHeadshot/Png",
      }));

      return res.json({ data: richUsers, isFallback: false });
    } catch (error: any) {
      console.warn("Roblox API Proxy failed. Using high-fidelity local fallback generator. Error detail:", error.message);
      const username = (req.query.username as string) || "RobloxPlayer";
      const fallbacks = generateMockUsers(username);
      return res.json({ data: fallbacks, isFallback: true, error: error.message });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
