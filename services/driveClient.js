export class DriveClient {
  constructor(authClient, googleClient) {
    this.authClient = authClient;
    this.googleClient = googleClient;
  }
  listFiles = async () => {
    const drive = this.googleClient.drive({
      version: "v3",
      auth: this.authClient,
    });
    const res = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name)",
    });
    const files = res.data.files;
    return files;
  };

  getLastFileId = async () => {
    const files = await this.listFiles();
    return files[0].id;
  };

  setAuthClient = async (authClient) => {
    this.authClient = authClient;
  };
}
