const fs = require("fs");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");

const links = [
  { url: "/", changefreq: "daily", priority: 1.0 },
  { url: "/portfolio", changefreq: "weekly", priority: 0.8 },
  { url: "/about", changefreq: "monthly", priority: 0.5 },
];

const stream = new SitemapStream({ hostname: "https://sarunaskarpovicius.site" });

(async () => {
  const sitemap = await streamToPromise(Readable.from(links).pipe(stream)).then(
    (data) => data.toString()
  );

  fs.writeFileSync("./public/sitemap.xml", sitemap, "utf8");
  console.log("Sitemap generated and saved to /public/sitemap.xml");
})();
