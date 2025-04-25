import express, { Router, Request, Response } from "express";
// import { WhatsAppController } from "../controller/WhatsAppController";

const router: Router = express.Router();
// const waController = new WhatsAppController();

// waController.initClient();

// Base route
router.get("/", (_req: Request, res: Response) => {
  res.send("WhatsApp Bot is live!");
});

// // Live QR code route
// router.get("/qr-live", (_req: Request, res: Response) => {
//   const qr = waController.getQRCode();
//   if (qr) {
//     res.type("text/html").send(`<img src="${qr}" /><p>Scan me!</p>`);
//   } else {
//     res.status(404).send("No QR code available.");
//   }
// });

// // Health check route
// router.get("/health", (_req: Request, res: Response) => {
//   res.status(200).send("Bot is healthy.");
// });

// // WhatsApp status route
// router.get("/status", (_req: Request, res: Response) => {
//   const client = waController.getClient();
//   res.status(200).json({ status: client ? "ready" : "not initialized" });
// });

// Catch-all route for undefined endpoints
// router.all("*", (req: Request, res: Response) => {
//   res.status(404).json({
//     message: "Route not found",
//     path: req.originalUrl,
//     method: req.method,
//   });
// });

export default router;
