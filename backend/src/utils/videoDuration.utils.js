import path from 'path';
import { execFile } from 'child_process';
import ffprobe from 'ffprobe-static';

const probeDurationSeconds = (filePath) =>
  new Promise((resolve, reject) => {
    execFile(
      ffprobe.path,
      [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath,
      ],
      (error, stdout) => {
        if (error) return reject(error);
        const durationSeconds = Number.parseFloat(String(stdout || '').trim());
        if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
          return reject(new Error('Unable to parse video duration'));
        }
        return resolve(durationSeconds);
      }
    );
  });

const toMins = (seconds) => Math.max(0, Math.round(seconds / 60));

const getDurationMinsFromFilePath = async (filePath) => {
  const seconds = await probeDurationSeconds(filePath);
  return toMins(seconds);
};

const getDurationMinsFromPublicVideoUrl = async (videoUrl) => {
  if (!videoUrl) return null;

  // With S3 integration, all video URLs are remote and public
  // ffprobe can natively analyze public URLs over an HTTP stream
  const seconds = await probeDurationSeconds(videoUrl);
  return toMins(seconds);
};

export { getDurationMinsFromFilePath, getDurationMinsFromPublicVideoUrl };