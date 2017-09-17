({
    baseUrl: '.',
    out: 'dist/EventDispatcher.js',
    optimize: 'none',
    include: ["node_modules/almond/almond", "src/EventDispatcher"],
    wrap: {
        start: 
        "(function (root, factory) { \n" +
        " \t if (typeof define === 'function' && define.amd) { \n" +
        "\t \t define([], factory); \n" +
        "\t} else { \n" +
        "\t \troot.EventDispatcher = root.EventDispatcher || {}; \n" +
        "\t \troot.EventDispatcher = factory();\n" +
        "\t}\n" +
        "}(this, function() {",
        end:
        "\n \t return require('src/EventDispatcher'); \n" +
        "}));"
    },
     paths:{
       List: "node_modules/jean-list/src/List",
       TypeCheck: "node_modules/jean-type-check/src/TypeCheck",
       Callback: "node_modules/jean-callback/src/Callback"
    }
})