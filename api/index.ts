import app from "../dist/server.cjs";
import serverless from "serverless-http";

export default serverless(app);
