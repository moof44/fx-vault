import { Octokit } from 'octokit';
import dotenv from 'dotenv';
import path from 'path';
import fileDirName from './utils.js';

dotenv.config();

const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

if (!token) {
  console.warn('WARNING: Neither GITHUB_PERSONAL_ACCESS_TOKEN nor GITHUB_TOKEN environment variable is set.');
}

export const octokit = new Octokit({
  auth: token,
});

export function getOctokit(): Octokit {
  return octokit;
}
