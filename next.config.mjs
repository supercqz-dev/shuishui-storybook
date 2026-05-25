const REPO_NAME = 'shuishui-storybook';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isGitHubPages ? { output: 'export' } : {}),
  basePath: isGitHubPages ? `/${REPO_NAME}` : '',
  assetPrefix: isGitHubPages ? `/${REPO_NAME}/` : '',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
