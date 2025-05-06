/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";

import typescriptParser from '@typescript-eslint/parser';
import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended",
    "plugin:@typescript-eslint/recommended",
    "eslint-config-prettier",
)), {
    files: [
        '**/*.js',
        '**/*.jsx',
        '**/*.cjs',
        '**/*.mjs',
        '**/*.ts',
        '**/*.tsx',
        '**/*.cts',
        '**/*.mts'
    ],
    ignores: [
        '**/node_modules/*',
        './packages/*',
        '**/polyfills/pointer-events.js',
        '**/polyfills/drag-events/index.js',// @todo ?
    ],
    languageOptions: {
        parser: typescriptParser,
        parserOptions: {
            projectService: true,
            // typescript-eslint specific options
            warnOnUnsupportedTypeScriptVersion: true,
        },
    },
    settings: {
        'import/resolver': {
            // Load <rootdir>/tsconfig.json
            typescript: {
                // Always try resolving any corresponding @types/* folders
                alwaysTryTypes: true,
            },
        },


        react: {
            version: "detect",
        },
    },
    rules: {
        "react-hooks/exhaustive-deps": "error",
        "no-unused-vars": ["error", {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: true,
            argsIgnorePattern: "^_",
        }],
        "@typescript-eslint/no-unused-vars": ["error", {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: true,
            argsIgnorePattern: "^_",
        }],
        "react/react-in-jsx-scope": "off",
    },
}];

