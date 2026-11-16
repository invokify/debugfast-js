module.exports = {
  devServer: {
    port: 5175,
  },
  configureWebpack: {
    resolve: {
      // `debugfast-js` is linked with `file:..`. Without this, webpack follows
      // the symlink to ../dist, which sits outside node_modules, so Babel
      // transpiles it and hides syntax a real npm consumer would choke on.
      symlinks: false,
    },
  },
};
