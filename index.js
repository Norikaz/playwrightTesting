// Norik Zhagui
const assert = require("assert");
const { chromium } = require("playwright");

const areArticlesInAscendingOrder = (articles) => {
  return articles.reduce((isSorted, currentArticle, index, array) => {
    if (index === 0) return true;
    const prevArticle = array[index - 1];
    return (
      isSorted &&
      new Date(prevArticle.timeStamp) >= new Date(currentArticle.timeStamp)
    );
  });
};

const extractArticleTimeStamp = async (articles) => {
  return await articles.evaluateAll((discussNodes) => {
    return discussNodes.map((discussNode) => {
      const subtextNode = discussNode.closest(".subtext");
      const titleNode = subtextNode.parentNode.previousElementSibling;
      const articleTitle =
        titleNode?.querySelector(".titleline")?.textContent.trim() ?? null;
      const articleTimeStamp =
        subtextNode.querySelector(".age")?.getAttribute("title") ?? null;
      return {
        timeStamp: articleTimeStamp,
        title: articleTitle,
      };
    });
  });
};

async function saveHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  //grab first 100 articales
  let articles = [];
  while (articles.length < 100) {
    const articleElements = await page.getByText("discuss");
    const articleTimes = await extractArticleTimeStamp(articleElements);
    articles = articles.concat(articleTimes);

    const moreButton = await page.getByRole("link", {
      name: "More",
      exact: true,
    });
    await moreButton.click();
  }

  if (articles.length >= 100) {
    articles = articles.slice(0, 100);
  }

  //assert acending order
  const result = areArticlesInAscendingOrder(articles);
  assert.equal(result, true);

  //clean up
  await context.close();
  await browser.close();
}

(async () => {
  await saveHackerNewsArticles();
})();
