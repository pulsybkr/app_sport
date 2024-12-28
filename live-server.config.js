const middleware = require('./middleware.js');

module.exports = {
  port: 8080,
  host: "0.0.0.0",
  root: "./public",
  open: true,
  mount: [['/dist', './dist']],
  file: "index.html",
  wait: 1000,
  logLevel: 2,
  middleware: [middleware],
  spa: true,
  ignore: ['dist']
};