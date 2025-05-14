module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // تجاهل تحذيرات source-map-loader للحزم المحددة
      webpackConfig.ignoreWarnings = [
        // تجاهل التحذيرات المتعلقة بـ stylis-plugin-rtl
        function ignoreSourcemapsloaderWarnings(warning) {
          if (warning.module && warning.module.resource && 
              warning.module.resource.includes('stylis-plugin-rtl')) {
            return true;
          }
          return false;
        },
      ];
      
      return webpackConfig;
    },
  },
}; 