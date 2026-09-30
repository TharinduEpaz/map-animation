import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./home.tsx"),
  route("/api/lambda/progress", "./progress.tsx"),
  route("/api/lambda/render", "./render.tsx"),
  route("/api/local/render", "./render-local.tsx"),
  route("/api/local/progress", "./progress-local.tsx"),
  route("/api/local/file/:id", "./file-local.tsx"),
] satisfies RouteConfig;
