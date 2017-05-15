'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
const path = require('path')

// 3rd party (libs)
const _ = require('lodash')
const merge = require('deepmerge')
const webpack = require('webpack')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

// 3rd party (middleware)
const presetReact = require('neutrino-preset-react')
const middlewareStandardReact = require('neutrino-middleware-standardreact')
const middlewareExtractStyles = require('neutrino-middleware-extractstyles')
const middlewareBundleAnalyzer = require('neutrino-middleware-bundleanalyzer')

/* -----------------------------------------------------------------------------
 * neutrino-web-app
 * -------------------------------------------------------------------------- */

// https://github.com/vuejs/vue-loader/issues/666#issuecomment-281966916
process.noDeprecation = true

module.exports = (neutrino) => {
  neutrino.options.output = path.join(neutrino.options.root, 'dist')

  neutrino.use(presetReact)
  neutrino.use(middlewareStandardReact)
  neutrino.use(middlewareExtractStyles)
  neutrino.use(middlewareBundleAnalyzer)

  // temporary until removed from neutrino-preset-web
  neutrino.config.node
    .set('Buffer', false)

  neutrino.config.stats({
    hash: false,
    assets: false,
    chunks: false,
    children: false,
    version: false,
    colors: true
  })

  neutrino.config.module
    .rule('compile')
    .use('babel')
    .tap((options) => merge(options, {
      presets: [ require.resolve('babel-preset-stage-0') ],
      plugins: [ require.resolve('babel-plugin-lodash') ]
    }))

  // transform lodash -> lodash-es... required due to lodash-es not
  // supporting lodash/fp
  neutrino.config.plugin('replace-lodash-es')
    .use(webpack.NormalModuleReplacementPlugin, [/^lodash-es(\/|$)/, (res) => {
      res.request = res.request.replace(/^lodash-es(\/|$)/, 'lodash$1');
    }])

  neutrino.config.plugin('lodash')
    .use(LodashModuleReplacementPlugin, [{
      'collections': true,
      'paths': true,
      'flattening': true
    }])

  if (process.env.NODE_ENV === 'development') {
    neutrino.config.devServer.host('0.0.0.0')
  }

  if (process.env.NODE_ENV !== 'development') {
    neutrino.config.plugin('clean')
      .tap(args => [args[0], merge(args[1], { exclude: ['static'] })])

    neutrino.config.plugin('copy')
      .tap(args => [[
        { context: neutrino.options.source, from: 'static/**/*' }
      ], args[1]])
  }
}
