import replace from 'rollup-plugin-re';
import multiEntry from "rollup-plugin-multi-entry";
import resolve from 'rollup-plugin-node-resolve';

export default {
    input: "./auto_tests/tests/*.js",
    output: {
        file: 'dist/tests.js',
        name: 'DygraphTests',
        format: 'iife'
    },
    plugins: [
        resolve(),
        replace({
            patterns: [
                {
                    test: /^import Dygraph from/gm,
                    replace: '// import Dygraph from',
                },
            ]
        }),
        multiEntry(),
    ]
};