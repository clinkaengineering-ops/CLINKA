import { Application } from "express"
import authRouter from "../modules/auth/auth.routes"
import userRouter from "../modules/users/user.routes"
import projectRouter from "../modules/projects/project.routes"
import bidRouter from "../modules/bids/bids.routes"

export default function registerRoutes(app: Application) {
  app.use("/api/auth", authRouter)
  app.use("/api/users", userRouter)
  app.use("/api/projects", projectRouter)
  app.use("/api/projects", bidRouter)
}