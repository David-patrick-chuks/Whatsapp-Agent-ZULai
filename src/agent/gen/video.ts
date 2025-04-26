// import { GoogleGenAI } from "@google/genai";
// import { createWriteStream, mkdirSync } from "fs";
// import { Readable } from "stream";
// import { join } from "path";

// const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

// async function main() {
//   let operation = await ai.models.generateVideos({
//     model: "veo-2.0-generate-001",
//     prompt: "Panning wide shot of a calico kitten sleeping in the sunshine",
//     config: {
//       personGeneration: "dont_allow",
//       aspectRatio: "16:9",
//     },
//   });

//   while (!operation.done) {
//     await new Promise((resolve) => setTimeout(resolve, 10000));
//     operation = await ai.operations.getVideosOperation({
//       operation: operation,
//     });
//   }

//   // Create 'downloads/videos' directory if not already present
//   const videoDir = join(__dirname, 'downloads', 'videos');
//   mkdirSync(videoDir, { recursive: true });

//   operation.response?.generatedVideos?.forEach(async (generatedVideo, n) => {
//     const resp = await fetch(`${generatedVideo.video?.uri}&key=GOOGLE_API_KEY`); // append your API key
//     const videoPath = join(videoDir, `video${n}.mp4`);
//     const writer = createWriteStream(videoPath);
//     if (!resp.body) {
//       throw new Error("Response body is null or undefined");
//     }
//     Readable.fromWeb(resp.body).pipe(writer);
//   });
// }

// main();
