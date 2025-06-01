import express from "express";
import {
  addAddress,
  getDefaultAddress,
  getUserProfile,
  removeAddress,
  setDefaultAddress,
  updateAddress,
  updateUserProfile,
} from "../controllers/user.controller.js";
import auth from "../middlewares/auth.middlware.js";

const router = express.Router();

router.put("/update-profile", auth, updateUserProfile);
router.get("/profile", auth, getUserProfile);
router.post("/address", auth, addAddress);
router.put("/address/:addressId", auth, updateAddress);
router.get("/address/default", auth, getDefaultAddress);
router.patch("/address/default/:addressId", auth, setDefaultAddress);
router.delete("/address/:addressId", auth, removeAddress);
export default router;
