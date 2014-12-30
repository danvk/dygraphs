module.exports = function (config) {
    config.set({
        basePath: '../',
        frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai', 'chai-things', 'dirty-chai'],
        files: [
            'bower_components/jquery/dist/jquery.min.js',
            'specs/utils/*.js',
            'dist/scratch/dygraph-combined.dev.js',
            'src/dygraph/extras/smooth-plotter.js',
            'specs/unit/**/*.spec.js'
        ],
        autoWatch: false,
        singleRun: true,
        reporters: ['spec', 'coverage'],
        preprocessors: {
            'dist/scratch/dygraph-combined.dev.js': ['coverage']
        },
        coverageReporter: {
            type: 'html',
            dir: 'dist/coverage'
        },
        browsers: ['PhantomJS'],
        plugins: [
            'karma-mocha',
            'karma-chai-plugins',
            'karma-phantomjs-launcher',
            'karma-coverage',
            'karma-spec-reporter'
        ]
    });
};
