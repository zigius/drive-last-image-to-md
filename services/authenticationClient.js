import express from "express";
import open from "open";

export class AuthenticationClient {
  constructor(oauth2Client) {
    this.oauth2Client = oauth2Client
  }
  authenticate = async () => {

        // token expired. Need to recreate it
        const app = express();

        let resolve;
        const p = new Promise((_resolve) => {
          resolve = _resolve;
        });
        app.get("/oauth2callback", function (req, res) {
          resolve(req.query.code);
          res.end("");
        });
        const server = await app.listen(8080);

        const scopes = [
          "https://www.googleapis.com/auth/drive.metadata.readonly",
        ];
        const authorizeUrl = this.oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: scopes.join(" "),
        });
        open(authorizeUrl, { wait: false }).then((cp) => cp.unref());

        // Wait for the first auth code
        const code = await p;
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates

        await server.close();
        return tokens;
  };
}

