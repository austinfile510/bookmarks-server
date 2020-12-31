const express = require("express");
const { isWebUri } = require("valid-url");
const xss = require("xss");
const { v4: uuid } = require("uuid");
const logger = require("../logger");
const { bookmarks } = require("../store");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = (bookmark) => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  rating: Number(bookmark.rating),
  desc: bookmark.desc,
});

bookmarksRouter
  .route("/bookmarks")
  .get((req, res) => {
    // displays bookmarks
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    for (const field of ["title", "url", "rating"]) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`'${field}' is required`);
      }
    }

    const { title, url, rating, desc } = req.body;

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`);
      return res.status(400).send(`'url' must be a valid URL`);
    }

    const id = uuid();

    const newBookmark = { id, title, url, rating, desc };

    bookmarks.push(newBookmark);

    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(serializeBookmark(newBookmark));
  });

bookmarksRouter
  .route("/bookmarks/:id")
  .get((req, res) => {
    // finds bookmarks by id
    const { id } = req.params;
    const bookmark = bookmarks.find((b) => b.id == id);
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).json({
        error: { message: `Bookmark Not Found` },
      });
    }
    res.json(bookmark);
  })

  .delete((req, res, next) => {
    // TODO: update to use db
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex((b) => b.id == id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send("Not found");
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Card with id ${id} deleted.`);

    res.status(204).end();
  });

module.exports = bookmarksRouter;
