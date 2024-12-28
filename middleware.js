module.exports = function(req, res, next) {
  const url = req.url;
  
  // Gestion des fichiers JavaScript
  if (url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    return next();
  }
  
  // Gestion des fichiers CSS
  if (url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    return next();
  }
  
  // Gestion des assets statiques
  if (url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
    return next();
  }
  
  // Pour le SPA routing - redirige tout vers index.html sauf les extensions connues
  if (!url.match(/\.[a-zA-Z0-9]+$/)) {
    req.url = '/index.html';
  }
  
  return next();
}; 