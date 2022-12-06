#!/usr/bin/env node

// Copyright 2012 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

import fs from "fs";
import Configstore from "configstore";
import yargs from "yargs";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

import { google } from "googleapis";
import { DriveClient } from "./services/driveClient.js";
import { AuthenticationClient } from "./services/authenticationClient.js";

const config = new Configstore("drive-cli");

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */

const keysFile = fs.readFileSync(path.resolve(__dirname, './oauth2.keys.json'));
let keys = JSON.parse(keysFile).web;

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0]
);

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({ auth: oauth2Client });

const argv = yargs(process.argv.slice(2))
  .command(
    "login",
    "the login command",
    () => {},
    async (argv) => {
      let authenticationClient = new AuthenticationClient(oauth2Client);
      const credentials = await authenticationClient.authenticate();
      oauth2Client.credentials = credentials; // eslint-disable-line require-atomic-updates
      config.set({ credentials: oauth2Client.credentials });
      process.exit(0);
    }
  )
  .command(
    "lastFile",
    "get last file",
    () => {},
    async (argv) => {
      let credentials = config.get("credentials");
      oauth2Client.credentials = credentials;
      let driveClient = new DriveClient(oauth2Client, google);
      let authenticationClient = new AuthenticationClient(oauth2Client);
      try {
        let id = await driveClient.getLastFileId();
        console.log(id);
        return id;
      } catch (e) {
        credentials = await authenticationClient.authenticate();
        oauth2Client.credentials = credentials; // eslint-disable-line require-atomic-updates
        config.set({ credentials: oauth2Client.credentials });

        let id = await driveClient.getLastFileId(oauth2Client);
        console.log(id);
      }
    }
  ).argv;
