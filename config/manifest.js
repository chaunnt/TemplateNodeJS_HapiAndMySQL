/* Copyright (c) 2020-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const AppConfig = require('../config/app');

const manifest = {
  server: {
    connections: {
      routes: {
        cors: {
          origin: [
            'http://localhost:3000', //CORS cua local web
            'http://localhost:3001', //CORS cua local web
            'http://localhost:3002', //CORS cua local web
            'http://127.0.0.1:3000', //CORS cua local web
            '*.zdn.vn',
            'localhost:3000', //CORS cua local web
            'https://h5.zdn.vn', //CORS cua Zalo Mini App
            'zbrowser://h5.zdn.vn', //CORS cua Zalo Mini App
          ],
        },
      },
    },
  },
  connections: [
    {
      router: {
        isCaseSensitive: false,
        stripTrailingSlash: true,
      },
      port: process.env.PORT || 5001,
      routes: {
        cors: true,
      },
      state: {
        // If your cookie format is not RFC 6265, set this param to false.
        strictHeader: false,
      },
    },
  ],
  registrations: [
    {
      plugin: {
        register: 'hapi-auth-jwt',
        options: AppConfig.jwt.options,
      },
    },
  ],
};

if (AppConfig.documentation.enable) {
  //FEATURE 2023020601 Improve Security of APIs
  if (process.env.NODE_ENV !== 'production') {
    manifest.registrations.push({
      plugin: {
        register: 'hapi-swagger',
        options: AppConfig.documentation.options,
      },
    });
  }

  if (AppConfig.documentation.options.documentationPage || AppConfig.documentation.options.swaggerUI) {
    manifest.registrations.push(
      {
        plugin: {
          register: 'inert',
          options: {},
        },
      },
      {
        plugin: {
          register: 'vision',
          options: {},
        },
      },
    );
  }
}

if (AppConfig.logging.console.enable || AppConfig.logging.loggly.enable) {
  const loggingPlugins = {
    plugin: {
      register: 'good',
      options: {
        reporters: {},
      },
    },
  };

  if (AppConfig.logging.console.enable) {
    loggingPlugins.plugin.options.reporters.consoleReporter = [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: AppConfig.logging.console.levels,
      },
      {
        module: 'good-console',
      },
      'stdout',
    ];
  }

  if (AppConfig.logging.loggly.enable) {
    loggingPlugins.plugin.options.reporters.logglyReporter = [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: AppConfig.logging.loggly.levels,
      },
      {
        module: 'good-loggly',
        args: [
          {
            token: AppConfig.logging.loggly.token,
            subdomain: AppConfig.logging.loggly.subdomain,
            tags: AppConfig.logging.loggly.tags,
            name: AppConfig.logging.loggly.name,
            hostname: AppConfig.logging.loggly.hostname,
            threshold: AppConfig.logging.loggly.threshold,
            maxDelay: AppConfig.logging.loggly.maxDelay,
          },
        ],
      },
    ];
  }

  manifest.registrations.push(loggingPlugins);
}

module.exports = manifest;
