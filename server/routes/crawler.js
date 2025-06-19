import express from "express";
import { handleRequest } from "../services/crawler.js";
const router = express.Router();

router.post("/", handleRequest);

export default router;