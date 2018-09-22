module.exports = {
  devServer: {
    port: 2020,
    proxy: {
      '/api': {
        target: 'http://localhost:5555/'
      }
    }
  }
}

