// Import the neccesary modules.
import Movie from "../models/Movie";
import { pageSize } from "../config/constants";

/**
 * @class
 * @classdesc The factory function for getting movie data from the MongoDB.
 * @memberof module:controllers/movies
 * @property {Object} projection - Object used for the projection of movies.
 */
export default class Movies {

  constructor() {
    Movies.projection = {
      _id: 1,
      imdb_id: 1,
      title: 1,
      year: 1,
      runtime: 1,
      images: 1,
      genres: 1,
      synopsis: 1,
      trailer: 1,
      certification: 1,
      released: 1,
      rating: 1,
      torrents: 1
    };
  };

  /**
   * @description Get all the pages.
   * @function Movies#getMovies
   * @memberof module:controllers/movies
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Array} - A list of pages which are available.
   */
  getMovies(req, res, next) {
    return Movie.count().exec().then(count => {
      const pages = Math.round(count / pageSize);
      const docs = [];

      for (let i = 1; i < pages + 1; i++) docs.push(`movies/${i}`);

      return res.json(docs);
    }).catch(err => next(err));
  };

  /**
   * @description Get one page.
   * @function Movies#getPage
   * @memberof module:controllers/movies
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Array} - The contents of one page.
   */
  getPage(req, res, next) {
    const page = req.params.page - 1;
    const offset = page * pageSize;

    if (req.params.page.match(/all/i)) {
      return Movie.aggregate([{
          $project: Movies.projection
        }, {
          $sort: {
            title: -1
          }
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => next(err));
    } else {
      const query = {};
      const data = req.query;

      if (!data.order) data.order = -1;

      let sort = {
        "rating.votes": parseInt(data.order, 10),
        "rating.percentage": parseInt(data.order, 10),
        "rating.watching": parseInt(data.order, 10)
      };

      if (data.keywords) {
        const words = data.keywords.split(" ");
        let regex = "^";
        for (let w in words) regex += `(?=.*\\b${RegExp.escape(words[w].toLowerCase())}\\b)`;
        query.title = {$regex: new RegExp(`${regex}.*`), $options: "gi"};
      }

      if (data.sort) {
        if (data.sort.match(/last added/i)) sort = {
          "released": parseInt(data.order, 10)
        };
        if (data.sort.match(/rating/i)) sort = {
          "rating.percentage": parseInt(data.order, 10),
          "rating.votes": parseInt(data.order, 10)
        };
        if (data.sort.match(/title/i)) sort = {
          "title": (parseInt(data.order, 10) * 1)
        };
        if (data.sort.match(/trending/i)) sort = {
          "rating.watching": parseInt(data.order, 10)
        };
        if (data.sort.match(/year/i)) sort = {
          "year": parseInt(data.order, 10)
        };
      }

      if (data.genre && !data.genre.match(/all/i)) {
        if (data.genre.match(/science[-\s]fiction/i) || data.genre.match(/sci[-\s]fi/i)) data.genre = "science-fiction";
        query.genres = data.genre.toLowerCase();
      }

      return Movie.aggregate([{
          $sort: sort
        }, {
          $match: query
        }, {
          $project: Movies.projection
        }, {
          $skip: offset
        }, {
          $limit: pageSize
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => next(err));
    }
  };

  /**
   * @description Get info from one movie.
   * @function Movies#getMovie
   * @memberof module:controllers/movies
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Movie} - The details of a single movie.
   */
  getMovie(req, res, next) {
    return Movie.aggregate([{
        $match: {
          _id: req.params.id
        }
      }, {
        $project: Movies.projection
      }, {
        $limit: 1
      }]).exec()
      .then(docs => res.json(docs[0]))
      .catch(err => next(err));
  };

  /**
   * @description Get a random movie.
   * @function Movies#getRandomMovie
   * @memberof module:controllers/movies
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Movie} - A random movie.
   */
  getRandomMovie(req, res, next) {
    return Movie.aggregate([{
        $project: Movies.projection
      }, {
        $sample: {
          size: 1
        }
      }, {
        $limit: 1
      }]).exec()
      .then(docs => res.json(docs[0]))
      .catch(err => next(err));
  };

};
