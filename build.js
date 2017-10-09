({
    baseUrl: '.',
    out: 'dist/jean-event-dispatcher.js',
    optimize: 'uglify2',
    name: "node_modules/jean-amd/dist/jean-amd",
    include: ["src/EventDispatcher"],
    wrap: {
        start: 
        "(function (root, factory) { \n" +
        " \t if (typeof define === 'function' && define.amd) { \n" +
        "\t \t define([], factory); \n" +
        "\t} else if(typeof module === 'object' && module.exports) { \n" +
        "\t\t module.exports = factory(); \n " +
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