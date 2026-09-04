const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const routes = ["/feed", "/requests", "/notifications", "/documents", "/votes", "/finance", "/emergency", "/services", "/operations", "/community", "/classifieds", "/ai"];
let failed = false;

for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    const accepted = response.ok || [301, 302, 303, 307, 308].includes(response.status);
    console.log(`${accepted ? "PASS" : "FAIL"} ${response.status} ${route}`);
    if (!accepted) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL network ${route}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed) process.exitCode = 1;
