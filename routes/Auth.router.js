import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
} from "../controllers/Auth.controller.js";
import { protectedRoute } from "../middlewares/Auth.middleware.js";

const router = express.Router();

// POST : Register
router.post("/register", register);
// POST : Login
router.post("/login", login);
// POST : Logout
router.post("/logout", logout);
// POST : Refresh Token
router.post("/refresh-token", refreshToken);
// GET : Profile
router.get("/profile", protectedRoute, getProfile);

export default router