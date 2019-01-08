import replace from 'rollup-plugin-re';
import { terser } from "rollup-plugin-terser";

const banner = '/*! @license Copyright 2017 Dan Vanderkam (danvdk@gmail.com) MIT-licensed (http://opensource.org/licenses/MIT) */';

export default [
    {
        input: 'index.js',
        output: {
            banner: banner,
            sourcemap: true,
            file: 'dist/dygraph.js',
            name: 'Dygraph',
            format: 'umd'
        },
        plugins: [
            replace({
                patterns: [
                    {
                        test: /typeof\(process\)/gm,
                        replace: 'true',
                    },
                    {
                        test: /process\.env\.NODE_ENV/gm,
                        replace: "'development'",
                    }
                ]
            }),
        ]
    },
    {
        input: 'index.js',
        output: {
            banner: banner,
            sourcemap: true,
            file: 'dist/dygraph.min.js',
            name: 'Dygraph',
            format: 'umd'
        },
        plugins: [
            replace({
                patterns: [
                    {
                        test: /typeof\(process\)/gm,
                        replace: "'undefined'",
                    },
                    {
                        test: /process\.env\.NODE_ENV/gm,
                        replace: "'production'",
                    }
                ]
            }),
            terser({
                output: {
                    comments: /^!/
                }
            }),
        ]
    }
];