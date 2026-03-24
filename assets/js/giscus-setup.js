function determineGiscusTheme() {
  
    let theme =
      localStorage.getItem("theme") ||
      document.documentElement.getAttribute("data-theme") ||
      "system";

    if (theme === "dark") return "preferred";
    if (theme === "light") return "preferred";

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "preferred" : "preferred";
  
}

(function setupGiscus() {
  let giscusTheme = determineGiscusTheme();

  let giscusAttributes = {
    src: "https://giscus.app/client.js",
    "data-repo": "JB4Jaison/jb4jaison.github.io",
    "data-repo-id": "R_kgDORpDNUA",
    "data-category": "Announcements",
    "data-category-id": "DIC_kwDORpDNUM4C5JE2",
    "data-mapping": "pathname",
    "data-strict": "0",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "bottom",
    "data-theme": giscusTheme,
    "data-lang": "en",
    crossorigin: "anonymous",
    async: true,
  };

  let giscusScript = document.createElement("script");
  Object.entries(giscusAttributes).forEach(([key, value]) =>
    giscusScript.setAttribute(key, value)
  );
  document.getElementById("giscus_thread").appendChild(giscusScript);
})();

