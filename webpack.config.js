const path = require("path");

let config = {
  mode: "production",
  entry: {
    planter: "./src/index.ts"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  output: {
    filename: "[name].min.js",
    library: "planter",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "dist")
  },
  externals: {
    bsv: "bsv"
  }
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    config.devtool = "source-map";
  }

  return config;
};
